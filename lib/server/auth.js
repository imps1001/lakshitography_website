import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { getDatabase } from "./database";

const encoder = new TextEncoder();
const jwtSecret = process.env.JWT_SECRET;

function getJwtSecret() {
  if (!jwtSecret) throw new Error("JWT_SECRET is not configured.");
  return encoder.encode(jwtSecret);
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

let adminSetupPromise;

export async function ensureAdmin() {
  if (!adminSetupPromise) {
    adminSetupPromise = (async () => {
      const db = await getDatabase();
      const users = db.collection("users");
      await users.createIndex({ email: 1 }, { unique: true });
      await db.collection("bookings").createIndex({ created_at: -1 });
      await db.collection("gallery").createIndex({ created_at: -1 });

      const email = (process.env.ADMIN_EMAIL || "lakshitography@gmail.com").trim().toLowerCase();
      const password = process.env.ADMIN_PASSWORD?.trim();
      if (!password || password.length < 8) throw new Error("ADMIN_PASSWORD must be set (at least 8 characters).");
      const existing = await users.findOne({ email });

      if (!existing) {
        await users.insertOne({
          id: randomUUID(),
          email,
          password_hash: await bcrypt.hash(password, 12),
          name: "Lakshit",
          role: "admin",
          created_at: new Date().toISOString(),
        });
      } else if (!(await bcrypt.compare(password, existing.password_hash || ""))) {
        await users.updateOne({ email }, { $set: { password_hash: await bcrypt.hash(password, 12) } });
      }
    })().catch((error) => {
      adminSetupPromise = undefined;
      throw error;
    });
  }

  await adminSetupPromise;
}

export async function createAccessToken(user) {
  return new SignJWT({ email: user.email, role: user.role, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getJwtSecret());
}

export async function getAdminFromRequest(request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { error: "Not authenticated", status: 401 };
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    await ensureAdmin();
    const db = await getDatabase();
    const user = await db.collection("users").findOne({ id: payload.sub });
    if (!user || user.role !== "admin") return { error: "Admin access required", status: 403 };
    return { user: publicUser(user) };
  } catch {
    return { error: "Invalid or expired token", status: 401 };
  }
}

export { publicUser };

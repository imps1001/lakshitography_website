"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("lakshitography@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && user.role === "admin") router.replace("/admin");
  }, [user, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back, Lakshita.");
      router.push("/admin");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="page-admin-login" className="min-h-screen bg-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="card w-full max-w-md p-8 sm:p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun/15"><Lock size={16} className="text-sun"/></span>
          <div>
            <p className="eyebrow">Studio access</p>
            <h1 className="font-display font-bold text-3xl text-ink">Admin sign in</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="block text-xs tracking-[0.2em] uppercase text-muted mb-2">Email</span>
            <input data-testid="admin-email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs tracking-[0.2em] uppercase text-muted mb-2">Password</span>
            <input data-testid="admin-password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="input" autoFocus />
          </label>

          <button type="submit" data-testid="admin-submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? "Signing in…" : "Enter"} <ArrowRight size={14} />
          </button>
        </form>

        <Link href="/" className="mt-8 inline-block text-xs tracking-[0.2em] uppercase text-muted hover:text-sun transition-colors">
          ← Back to site
        </Link>
      </motion.div>

    </div>
  );
}

import { Camera } from "lucide-react";
import { focusPosition } from "@/lib/portfolio";
import { optimizedImage } from "@/lib/utils";

// Renders a portfolio photo cropped around its focal point, or a branded placeholder while
// loading / when none is assigned yet.
export default function PortfolioImage({ photo, fallbackAlt = "", width = 1600, loading = false, className = "" }) {
  if (photo?.url) {
    return (
      <img
        src={optimizedImage(photo.url, width)}
        alt={photo.alt || fallbackAlt || "Lakshitography photo"}
        loading="lazy"
        style={{ objectPosition: focusPosition(photo) }}
        className={className}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`${className} flex items-center justify-center bg-gradient-to-br from-surface-2 via-surface to-sun/10 ${
        loading ? "animate-pulse" : ""
      }`}
    >
      {!loading && <Camera size={28} className="text-ink/20" />}
    </div>
  );
}

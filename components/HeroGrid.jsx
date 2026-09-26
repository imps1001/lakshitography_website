"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PortfolioImage from "@/components/PortfolioImage";

// Bento of 3 tiles; when there are more hero photos than tiles, each tile cycles on a staggered timer.
const TILES = [
  { className: "row-span-2 rounded-[2rem]", delay: 0 },
  { className: "rounded-[2rem]", delay: 900 },
  { className: "rounded-[2rem]", delay: 1800 },
];

export default function HeroGrid({ photos = [], loading = false }) {
  const [indices, setIndices] = useState([0, 1, 2]);
  const poolKey = photos.map((photo) => photo.id).join("|");

  useEffect(() => {
    setIndices([0, 1, 2]);
    const count = photos.length;
    if (count <= TILES.length) return undefined;
    const timers = [];
    TILES.forEach((t, i) => {
      const start = setTimeout(() => {
        const id = setInterval(() => {
          setIndices((prev) => {
            const next = [...prev];
            let n = (next[i] + 1) % count;
            while (next.includes(n)) n = (n + 1) % count;
            next[i] = n;
            return next;
          });
        }, 3800);
        timers.push(id);
      }, t.delay);
      timers.push(start);
    });
    return () => timers.forEach((id) => { clearInterval(id); clearTimeout(id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);

  return (
    <div data-testid="hero-grid" className="grid h-full w-full grid-cols-2 grid-rows-2 gap-3">
      {TILES.map((tile, tileIdx) => {
        const photo = photos.length ? photos[indices[tileIdx] % photos.length] : null;
        return (
          <motion.div
            key={tileIdx}
            data-testid={`hero-tile-${tileIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 + tileIdx * 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            className={`grain relative overflow-hidden bg-surface ${tile.className}`}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={photo?.id || "empty"}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <PortfolioImage
                  photo={photo}
                  loading={loading}
                  width={1000}
                  fallbackAlt={`Lakshitography frame ${tileIdx + 1}`}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

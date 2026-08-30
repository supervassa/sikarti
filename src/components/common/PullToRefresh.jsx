import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh kustom untuk WEB + PWA (mode standalone tidak punya PTR bawaan).
 *
 * - Hanya aktif bila kontainer yang di-scroll sedang berada di paling atas.
 * - Ada tahanan (resistance) supaya tarikan terasa halus, tidak kaku.
 * - Lewati ambang lalu lepas => reload halaman (atau panggil onRefresh bila ada).
 *
 * Dipasang sekali di App, merender indikator fixed di puncak layar.
 */

const TRIGGER = 72; // px tarikan efektif untuk memicu refresh
const MAX_PULL = 120; // batas visual indikator

// Cari leluhur terdekat yang benar-benar bisa di-scroll vertikal.
function scrollableAncestor(node) {
  let el = node;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof Element) {
      const oy = getComputedStyle(el).overflowY;
      if (
        (oy === "auto" || oy === "scroll" || oy === "overlay") &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        return el;
      }
    }
    el = el.parentNode;
  }
  return null; // => pakai window
}

export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0); // jarak tarik efektif (sesudah tahanan)
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false); // jari sedang menarik (mematikan transisi)

  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const trackRef = useRef({ startY: 0, startX: 0, tracking: false, armed: false });

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);
  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    const s = trackRef.current;

    const atTop = (target) => {
      const sc = scrollableAncestor(target);
      if (sc) return sc.scrollTop <= 0;
      return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    };

    const onStart = (e) => {
      if (refreshingRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      s.startY = t.clientY;
      s.startX = t.clientX;
      s.tracking = atTop(e.target);
      s.armed = false;
    };

    const onMove = (e) => {
      if (!s.tracking || refreshingRef.current) return;
      const t = e.touches[0];
      const dy = t.clientY - s.startY;
      const dx = t.clientX - s.startX;

      // butuh gerak turun yang dominan vertikal
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        if (!s.armed) s.tracking = false;
        return;
      }
      // konten bisa saja sudah ter-scroll sejak sentuhan dimulai
      if (!atTop(e.target)) {
        s.tracking = false;
        s.armed = false;
        setDragging(false);
        if (pullRef.current) setPull(0);
        return;
      }

      if (!s.armed) setDragging(true);
      s.armed = true;
      e.preventDefault(); // tahan scroll/refresh bawaan selama menarik

      const eff = Math.min(MAX_PULL, Math.pow(dy, 0.85)); // tahanan progresif
      setPull(eff);
    };

    const finish = () => {
      setDragging(false);
      if (!s.armed) {
        s.tracking = false;
        return;
      }
      s.tracking = false;
      s.armed = false;

      if (pullRef.current < TRIGGER) {
        setPull(0);
        return;
      }

      setRefreshing(true);
      setPull(TRIGGER);

      if (!onRefresh) {
        window.location.reload();
        return;
      }
      Promise.resolve()
        .then(onRefresh)
        .then(() => {
          setRefreshing(false);
          setPull(0);
        })
        .catch(() => window.location.reload());
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", finish, { passive: true });
    document.addEventListener("touchcancel", finish, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", finish);
    };
  }, [onRefresh]);

  const progress = Math.min(1, pull / TRIGGER);
  const armed = progress >= 1;
  const visible = pull > 0 || refreshing;
  const offset = (refreshing ? TRIGGER : pull) - 44;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2147483000,
        transform: `translateY(${offset}px)`,
        transition: dragging
          ? "none"
          : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          background: "var(--ptr-bg, #ffffff)",
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.18)",
          opacity: visible ? 1 : 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: refreshing ? "ptr-spin 0.7s linear infinite" : "none",
            transform: refreshing
              ? "none"
              : `rotate(${armed ? 180 : progress * 90}deg)`,
            transition: refreshing ? "none" : "transform 0.15s linear",
          }}
        >
          {refreshing ? (
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          ) : (
            <>
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </>
          )}
        </svg>
      </div>
      <style>{`
        @keyframes ptr-spin { to { transform: rotate(360deg); } }
        :root { --ptr-bg: #ffffff; }
        html.dark { --ptr-bg: #1e293b; }
      `}</style>
    </div>
  );
}

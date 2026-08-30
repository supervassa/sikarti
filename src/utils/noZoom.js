// Nonaktifkan zoom halaman — HANYA saat berjalan sebagai PWA (mode standalone).
// Di web browser biasa fungsi ini tidak melakukan apa pun.
//
// Meta viewport `user-scalable=no` + CSS `touch-action: pan-x pan-y` sudah
// menangani sebagian besar kasus, tetapi Safari iOS masih mengizinkan:
//   - pinch-zoom lewat event `gesture*`
//   - double-tap zoom
// Guard di bawah menutup dua celah itu. Elemen ber-class `allow-zoom`
// (mis. peta atau pratinjau gambar) dikecualikan.

export const isStandalone = () => {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia;
  return (
    (!!mm &&
      (mm("(display-mode: standalone)").matches ||
        mm("(display-mode: fullscreen)").matches ||
        mm("(display-mode: minimal-ui)").matches)) ||
    window.navigator.standalone === true
  );
};

const isAllowed = (target) =>
  target instanceof Element && target.closest(".allow-zoom");

export function installNoZoom() {
  if (typeof window === "undefined") return;
  if (!isStandalone()) return; // web biasa: biarkan zoom aktif

  // 1. Pinch-zoom Safari (gesturestart/change/end tidak ada di browser lain).
  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    document.addEventListener(
      type,
      (e) => {
        if (!isAllowed(e.target)) e.preventDefault();
      },
      { passive: false },
    );
  });

  // 2. Pinch-zoom via multi-touch (Android/Chrome yang tak hormati touch-action).
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1 && !isAllowed(e.target)) e.preventDefault();
    },
    { passive: false },
  );

  // 3. Double-tap zoom: blokir tap kedua < 300ms dari tap pertama.
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300 && !isAllowed(e.target)) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );

  // 4. Ctrl/Cmd + scroll dan Ctrl/Cmd + (+/-/0) di desktop.
  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener("keydown", (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      ["+", "-", "=", "0"].includes(e.key)
    ) {
      e.preventDefault();
    }
  });
}

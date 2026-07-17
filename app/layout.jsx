import "./globals.css";

export const metadata = {
  title: "Aniindex",
  description: "A fan content index for anime series, arcs, and characters.",
};

// Session 30: this was missing entirely. Without it, a real mobile
// browser doesn't render at the device's actual CSS pixel width — it
// assumes a desktop-sized layout viewport (~980px on iOS Safari) and
// zooms the whole page out to fit the screen. Chrome DevTools' and
// Playwright's viewport emulation both bypass this (they set the
// rendering viewport directly), which is exactly why Session 29's mobile
// testing found zero overflow there while real devices still showed it —
// every `@media (max-width: 768px)`/`(max-width: 480px)` rule added that
// session was very likely never matching on an actual phone at all,
// since the browser's layout viewport stayed near 980px regardless of
// the physical screen size.
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

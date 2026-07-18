// Phase 8 (Session 45): app/auth/page.jsx and app/auth/callback/page.jsx
// are both client components, so metadata can't be exported from either
// file directly (see app/submit/layout.jsx's comment for the full
// reasoning) — this layout covers both routes, since neither has any
// metadata more specific than "this is the sign-in flow." `robots:
// {index:false}` is deliberate, not an oversight: a sign-in form and a
// magic-link redirect handler have no content worth ranking, and
// indexing them risks a search engine treating a stale `?code=` callback
// URL as a real landing page.
export const metadata = {
  title: "Sign in",
  description: "Sign in to Aniindex with a magic link to track and confirm your submissions.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return children;
}

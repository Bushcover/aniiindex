// Phase 8 (Session 45): app/submit/page.jsx is a client component ("use
// client", since it owns all wizard state) — the Metadata API only works
// from a Server Component, and a file can't be both "use client" and
// export `metadata` at once. This layout is the standard Next.js
// workaround: a plain Server Component sibling in the same route segment
// that exports metadata and otherwise just renders its children
// unchanged, letting the client page below it keep owning the page's
// actual UI/state.
export const metadata = {
  title: "Submit content",
  description: "Submit a fan edit, art piece, or discussion link and place it on the right arc and story beat.",
  alternates: { canonical: "/submit" },
};

export default function SubmitLayout({ children }) {
  return children;
}

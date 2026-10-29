// Footer links to the static legal pages in public/. Plain anchors rather than
// router links: those pages live outside the React app.
export const LegalLinks = () => (
  <footer className="py-6 text-center text-xs text-muted">
    <a href="/impressum/" className="hover:text-content transition-colors">
      Impressum
    </a>
    <span aria-hidden="true" className="mx-2">
      ·
    </span>
    <a href="/privacy/" className="hover:text-content transition-colors">
      Privacy
    </a>
  </footer>
);

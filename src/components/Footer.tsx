import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between text-sm">
        <div>
          <p className="font-mono">gitworth</p>
          <p className="text-muted-foreground mt-1">A playful appraisal of public GitHub stats. Not financial advice.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Home</Link>
          <Link to="/compare" className="hover:text-foreground transition">Compare</Link>
          <Link to="/leaderboard" className="hover:text-foreground transition">Leaderboard</Link>
          <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="hover:text-foreground transition">GitHub API ↗</a>
        </nav>
      </div>
    </footer>
  );
}

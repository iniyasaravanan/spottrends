import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-ivory-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link
          href="/"
          className="font-display font-bold text-lg text-navy hover:text-navy-light transition tracking-tight"
        >
          Genre Explorer
        </Link>

        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs text-navy-muted hover:text-navy transition"
        >
          Powered by Last.fm
        </a>

      </div>
    </nav>
  );
}

import Link from "next/link";
import { Music2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-lfm-border bg-lfm-bg/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-bold text-lg hover:text-lfm-red transition"
        >
          <Music2 size={20} className="text-lfm-red" />
          Genre Explorer
        </Link>

        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-lfm-muted hover:text-lfm-light transition"
        >
          Powered by Last.fm
        </a>
      </div>
    </nav>
  );
}

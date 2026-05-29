import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-cream-50/90 backdrop-blur border-b border-cream-300">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link
          href="/"
          className="flex items-center gap-2 font-hand text-2xl text-brown-800 hover:text-brown-600 transition"
        >
          <span className="text-xl">♪</span>
          Genre Explorer
          <span className="text-xl">♫</span>
        </Link>

        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-hand text-sm text-brown-400 hover:text-brown-600 transition"
        >
          powered by Last.fm ✦
        </a>

      </div>
    </nav>
  );
}

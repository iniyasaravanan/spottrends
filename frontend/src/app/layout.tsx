import type { Metadata } from "next";
import { Caveat, Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Genre Explorer — Discover Music Through Artists",
  description:
    "Search any artist, explore their genres, read their bio, and travel through webs of similar musicians — powered by Last.fm.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${caveat.variable} ${nunito.variable}`}>
      <body>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>
      </body>
    </html>
  );
}

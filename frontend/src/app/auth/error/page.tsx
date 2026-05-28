"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "unknown_error";

  const messages: Record<string, string> = {
    invalid_state: "Invalid OAuth state — possible CSRF attempt.",
    missing_token: "No token received from server.",
    server_error: "A server error occurred during login.",
    access_denied: "You denied access to your Spotify account.",
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-4xl">⚠️</p>
        <h1 className="text-2xl font-bold">Login Failed</h1>
        <p className="text-spotify-light">
          {messages[reason] ?? `An error occurred: ${reason}`}
        </p>
        <Link href="/" className="btn-primary inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}

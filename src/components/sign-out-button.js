"use client";

export function SignOutButton() {
  async function handleSignOut() {
    document.cookie =
      "session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
      </svg>
      Sign out
    </button>
  );
}

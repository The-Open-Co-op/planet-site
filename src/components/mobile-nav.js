"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default function MobileNav({ navItems, email }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Find current page label
  const current = navItems.find((item) => item.href === pathname);
  const pageTitle = current?.label || "Collab";

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-foreground/10 bg-white px-4 py-3">
        <Link href="/home" className="font-display text-lg font-bold">
          Collab
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-1 text-foreground/60"
          aria-label="Menu"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="border-b border-foreground/10 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? "bg-primary/5 text-primary font-medium"
                  : "hover:bg-foreground/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-foreground/10">
            <Link
              href="/home/profile"
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors mb-1 ${
                pathname === "/home/profile"
                  ? "bg-primary/5 text-primary font-medium"
                  : "hover:bg-foreground/5"
              }`}
            >
              My Profile
            </Link>
            <p className="text-xs text-foreground/50 mb-2 truncate px-3">
              {email}
            </p>
            <div className="px-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

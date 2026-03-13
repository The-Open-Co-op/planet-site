import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import MobileNav from "@/components/mobile-nav";

const navItems = [
  { href: "/home", label: "Dashboard" },
  { href: "/home/members", label: "Members" },
  { href: "/home/feedback", label: "Feedback" },
];

export default async function HomeLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <MobileNav navItems={navItems} email={session.user?.email} />

      {/* Sidebar (desktop) */}
      <aside className="w-64 shrink-0 border-r border-foreground/10 bg-white p-6 hidden md:block">
        <Link href="/" className="font-display text-xl font-bold block mb-8">
          Collab <span className="text-foreground/40 font-normal text-sm">The Open Co-op</span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-foreground/10">
          <Link
            href="/home/profile"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors mb-2"
          >
            My Profile
          </Link>
          <p className="text-xs text-foreground/50 mb-2 truncate px-3">
            {session.user?.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 md:p-10 overflow-x-hidden">{children}</main>
    </div>
  );
}

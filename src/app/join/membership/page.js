"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const paidTiers = [
  {
    label: "Supporter",
    price: "£5/month",
    description: "Support the mission",
    href: "https://opencollective.com/open-coop/contribute/planet-pioneer-14003/checkout?redirect=https://collab.open.coop/welcome",
  },
  {
    label: "Supporter+",
    price: "£10/month",
    description: "Support the mission",
    href: "https://opencollective.com/open-coop/contribute/planet-pioneer-61741/checkout?redirect=https://collab.open.coop/welcome",
  },
  {
    label: "Catalyst",
    price: "£50/month",
    description: "Accelerate the vision",
    href: "https://opencollective.com/open-coop/contribute/catalyst-14004/checkout?redirect=https://collab.open.coop/welcome",
  },
];

function FreeTierForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/free-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/welcome?free=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        required
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
      />
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join for free"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

export default function MembershipPage() {
  const [showFreeForm, setShowFreeForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-2xl w-full">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Membership Level
        </h1>
        <p className="mt-6 text-lg text-foreground/70">
          Choose what works for you. Every member gets the same voice
          regardless of what they pay.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          {paidTiers.map((tier) => (
            <a
              key={tier.label}
              href={tier.href}
              className="flex flex-col items-center rounded-xl border-2 border-foreground/10 bg-white p-8 hover:border-primary transition-all text-center"
            >
              <span className="font-display text-2xl font-bold">
                {tier.label}
              </span>
              <span className="mt-2 text-lg text-primary font-medium">
                {tier.price}
              </span>
              <span className="mt-1 text-sm text-foreground/50">
                {tier.description}
              </span>
            </a>
          ))}

          {showFreeForm ? (
            <div className="rounded-xl border-2 border-primary bg-white p-8">
              <h3 className="font-display text-2xl font-bold text-center mb-1">Free</h3>
              <p className="text-sm text-foreground/50 text-center mb-6">Full membership, no cost</p>
              <FreeTierForm />
            </div>
          ) : (
            <button
              onClick={() => setShowFreeForm(true)}
              className="flex flex-col items-center rounded-xl border-2 border-foreground/10 bg-white p-8 hover:border-primary transition-all text-center"
            >
              <span className="font-display text-2xl font-bold">Free</span>
              <span className="mt-2 text-lg text-primary font-medium">
                £0/month
              </span>
              <span className="mt-1 text-sm text-foreground/50">
                Full membership, no cost
              </span>
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-foreground/40">
          Paid tiers go via Open Collective for transparent finances.
        </p>
      </div>
    </div>
  );
}

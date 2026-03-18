"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSigningIn, setAutoSigningIn] = useState(false);
  const [orderParams, setOrderParams] = useState(null);
  const [ocAccount, setOcAccount] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [memberName, setMemberName] = useState(null);

  useEffect(() => {
    // Free signup — already signed in by the API
    if (searchParams.get("free") === "1") {
      setSignedIn(true);
      return;
    }

    const orderIdV2 = searchParams.get("orderIdV2");
    const legacyOrderId = searchParams.get("orderId");
    if (
      (orderIdV2 || legacyOrderId) &&
      ["PAID", "ACTIVE"].includes(searchParams.get("status"))
    ) {
      setOrderParams({ orderIdV2, legacyOrderId });
      setAutoSigningIn(true);

      fetch("/api/auth/quick-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIdV2, legacyOrderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setMemberName(data.name || null);
            setSignedIn(true);
          } else if (data.error === "need_email") {
            // OC can't provide email — show form immediately
            setOcAccount({ name: data.name, slug: data.slug, tier: data.tier });
            if (data.name) setMemberName(data.name);
          }
          setAutoSigningIn(false);
        })
        .catch(() => {
          setAutoSigningIn(false);
        });
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/quick-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...orderParams,
          ocName: ocAccount?.name,
          ocSlug: ocAccount?.slug,
          ocTier: ocAccount?.tier,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "not_a_member") {
          setError(
            "We can\u2019t find that email yet \u2014 it can take a moment to process. Please try again shortly."
          );
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      setMemberName(data.name || null);
      setSignedIn(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (autoSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-4xl font-bold mb-4">
            Signing you in...
          </h1>
          <p className="text-foreground/60">One moment.</p>
        </div>
      </div>
    );
  }

  if (signedIn) {
    const firstName = memberName?.split(" ")[0];
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <h1 className="font-display text-5xl font-bold mb-6">
            Welcome{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="text-xl text-foreground/70 mb-4 leading-relaxed">
            You&rsquo;re now a member of The Open Co-op.
          </p>
          <p className="text-lg text-foreground/50 mb-10 leading-relaxed">
            Thank you for joining. You&rsquo;ve taken a critical step to support
            the development of a collaborative regenerative economy and
            we&rsquo;re really happy to have you on board.
          </p>
          <button
            onClick={() => router.push("/get-started")}
            className="rounded-lg bg-primary px-8 py-4 text-white text-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Let&rsquo;s get you set up &rarr;
          </button>
        </div>
      </div>
    );
  }

  const firstName = memberName?.split(" ")[0];

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-4xl font-bold mb-1">
          {firstName ? `Hi ${firstName}!` : "Welcome to"}
        </h1>
        {!firstName && (
          <h1 className="font-display text-4xl font-bold mb-4">
            The Open Co-op
          </h1>
        )}
        <p className="text-lg text-foreground/70 mb-6">
          Thank you for joining us.
        </p>
        <p className="text-foreground/60 mb-8">
          {orderParams
            ? "Please confirm the email you used on Open Collective to complete your sign-in."
            : "Enter the email you used on Open Collective to go straight to the member area."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeContent />
    </Suspense>
  );
}

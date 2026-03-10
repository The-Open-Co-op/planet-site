"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to send code");
      setStep("code");
    } catch {
      setError("Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("email-code", {
      email,
      code,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid code. Please try again.");
      setLoading(false);
    } else {
      window.location.href = "/home";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold mb-2">Sign in</h1>

        {step === "email" ? (
          <>
            <p className="text-foreground/60 mb-8">
              Enter your email and we&apos;ll send you a sign-in code.
            </p>
            <form onSubmit={handleSendCode} className="space-y-4">
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
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-foreground/60 mb-8">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="text"
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground text-center text-2xl tracking-widest placeholder:text-foreground/40 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Sign in"}
              </button>
            </form>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="mt-4 text-sm text-foreground/50 hover:text-foreground"
            >
              Use a different email
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-6 text-sm text-foreground/50 text-center">
          You need to be a member of{" "}
          <a
            href="https://opencollective.com/the-open-co-op"
            className="text-primary hover:underline"
          >
            The Open Co-op
          </a>{" "}
          to access the member home.
        </p>
      </div>
    </div>
  );
}

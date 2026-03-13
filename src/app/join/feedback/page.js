"use client";

import { useState } from "react";

export default function JoinFeedbackPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "join-feedback",
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
        <div className="max-w-2xl w-full">
          <h1 className="font-display text-4xl font-bold">Thank you</h1>
          <p className="mt-4 text-lg text-foreground/70">
            We appreciate your honesty. Your feedback will help us improve.
          </p>
          <a
            href="/"
            className="inline-block mt-8 text-primary hover:underline font-medium"
          >
            &larr; Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-2xl w-full">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Oh! That&rsquo;s a shame.
        </h1>
        <p className="mt-6 text-lg text-foreground/70">
          What would help you change your mind?
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts..."
            rows={5}
            required
            className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="mt-4 rounded-full bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {sending ? "Sending..." : "Send feedback"}
          </button>
          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}
        </form>

        <a
          href="/join"
          className="inline-block mt-8 text-foreground/40 hover:text-primary transition-colors text-sm"
        >
          &larr; Back to principles
        </a>
      </div>
    </div>
  );
}

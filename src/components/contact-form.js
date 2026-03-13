"use client";

import { useState } from "react";

export default function ContactForm({ memberId, memberName }) {
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
      const res = await fetch("/api/contact-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-white p-4 mb-6">
        <p className="text-sm text-green-600">
          Message sent to {memberName}!
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-xs text-primary hover:underline mt-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-foreground/10 bg-white p-4 mb-6"
    >
      <h3 className="font-display font-bold text-sm mb-2">
        Send a message to {memberName}
      </h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Write a message to ${memberName}...`}
        rows={3}
        required
        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none mb-2"
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
      >
        {sending ? "Sending..." : "Send message"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-foreground/30 mt-2">
        This sends an email to {memberName} with your email in the reply-to field.
      </p>
    </form>
  );
}

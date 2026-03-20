"use client";

import { useState, useEffect } from "react";

const categories = [
  { label: "Collab site", value: "collab" },
  { label: "PLANET product", value: "planet" },
  { label: "Governance", value: "governance" },
  { label: "Other", value: "other" },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  async function loadFeedback() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingFeed(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setMessage("");
      setCategory("");
      loadFeedback();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function labelForContext(item) {
    if (item.demo_slug) {
      const parts = [item.demo_slug.replace(/-/g, " ")];
      if (item.demo_step_title) parts.push(item.demo_step_title);
      return parts.join(" — ");
    }
    if (item.category) {
      const cat = categories.find((c) => c.value === item.category);
      return cat ? cat.label : item.category;
    }
    return null;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">
        Feedback & Questions
      </h1>
      <p className="text-foreground/50 mb-8">
        About Collab, the co-op, PLANET, or anything else. We read everything.
      </p>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1">
            Category (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder="What's on your mind?"
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send feedback"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Feed */}
      <h2 className="font-display text-lg font-bold mb-4">All feedback</h2>

      {loadingFeed ? (
        <p className="text-sm text-foreground/40">Loading...</p>
      ) : feedback.length === 0 ? (
        <p className="text-sm text-foreground/40">No feedback yet.</p>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => {
            const context = labelForContext(item);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-foreground/10 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-foreground/5 overflow-hidden flex items-center justify-center shrink-0">
                      {item.members?.avatar_url ? (
                        <img
                          src={item.members.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-foreground/30">
                          {(item.members?.name || item.email || "?")[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {item.members?.name || item.email || "Anonymous"}
                    </span>
                  </div>
                  <span className="text-xs text-foreground/30 shrink-0">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                {context && (
                  <span className="inline-block text-xs bg-foreground/5 text-foreground/50 rounded-full px-2.5 py-0.5 mb-2">
                    {context}
                  </span>
                )}
                <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                  {item.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

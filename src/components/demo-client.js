"use client";

import { useState, useEffect, useRef } from "react";

export default function DemoClient({ demoSlug, demoTitle, demoUrl, user }) {
  const [showForm, setShowForm] = useState(false);
  const [demoStep, setDemoStep] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  // Listen for postMessage from the demo iframe
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === "demo-step-change") {
        setDemoStep({
          slug: e.data.slug || null,
          title: e.data.title || null,
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Close form on click outside
  useEffect(() => {
    if (!showForm) return;
    function handleClick(e) {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setShowForm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showForm]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "demo",
          message,
          demo_slug: demoSlug,
          demo_step: demoStep?.slug || null,
          demo_step_title: demoStep?.title || null,
        }),
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

  const stepLabel = demoStep?.title
    ? `Step: ${demoStep.title}`
    : null;

  const btnStyle = {
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <iframe
        src={demoUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="clipboard-read; clipboard-write"
        title={demoTitle}
      />

      {/* Feedback button */}
      <button
        onClick={() => {
          setShowForm((v) => !v);
          setSent(false);
          setError("");
        }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#0066CC",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          zIndex: 1000,
          ...btnStyle,
        }}
      >
        Feedback
      </button>

      {/* Feedback panel */}
      {showForm && (
        <div
          ref={formRef}
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 360,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            padding: 24,
            zIndex: 1001,
            ...btnStyle,
          }}
        >
          {!user ? (
            // Not signed in — encourage sign-up
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
                We'd love your feedback
              </p>
              <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px", lineHeight: 1.5 }}>
                Join The Open Co-op to submit feedback on these designs.
              </p>
              <a
                href="https://collab.open.coop/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#0066CC",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  ...btnStyle,
                }}
              >
                Join The Open Co-op
              </a>
            </div>
          ) : sent ? (
            // Sent confirmation
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
                Thank you!
              </p>
              <p style={{ fontSize: 14, color: "#666", margin: "0 0 12px" }}>
                Your feedback has been recorded.
              </p>
              <a
                href="https://collab.open.coop/home/feedback"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  fontSize: 13,
                  color: "#0066CC",
                  marginBottom: 12,
                }}
              >
                View all feedback &rarr;
              </a>
              <br />
              <button
                onClick={() => setSent(false)}
                style={{
                  fontSize: 13,
                  color: "#0066CC",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Send more feedback
              </button>
            </div>
          ) : (
            // Feedback form
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>
                Feedback
              </p>
              {stepLabel && (
                <p style={{ fontSize: 12, color: "#999", margin: "0 0 12px" }}>
                  {stepLabel}
                </p>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="What do you think about this?"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid #e0e0e0",
                  padding: "12px",
                  fontSize: 14,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                style={{
                  marginTop: 12,
                  width: "100%",
                  background: sending || !message.trim() ? "#ccc" : "#0066CC",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: sending || !message.trim() ? "default" : "pointer",
                  ...btnStyle,
                }}
              >
                {sending ? "Sending..." : "Send feedback"}
              </button>
              {error && (
                <p style={{ fontSize: 13, color: "#d32f2f", marginTop: 8 }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

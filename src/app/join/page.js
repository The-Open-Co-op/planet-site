"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const principles = [
  {
    title: "People and Planet Over Profit",
    lines: [
      "We depend on planet Earth for our survival.",
      "We restore and regenerate the living systems we rely on and consider the wellbeing of future generations in every decision.",
    ],
  },
  {
    title: "Cooperation Over Competition",
    lines: [
      "We cooperate to build a world of shared prosperity.",
      "We work together to create an economy that benefits everyone.",
    ],
  },
  {
    title: "Trust Over Control",
    lines: [
      "We start from trust.",
      "We empower people and communities to act with autonomy and responsibility.",
    ],
  },
];

export default function JoinPage() {
  const router = useRouter();
  const [checked, setChecked] = useState([false, false, false]);
  const allChecked = checked.every(Boolean);

  function toggle(i) {
    setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)));
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 py-6">
      <div className="max-w-2xl w-full">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Join The Open Co-op
        </h1>
        <p className="mt-3 text-foreground/70 leading-relaxed">
          We&rsquo;re working to catalyse the collaborative, regenerative economy.
        </p>
        <p className="mt-2 text-foreground/70 leading-relaxed">
          Our mission is to co-create PLANET — a member-owned co-operating system
          to support collaboration at scale.
        </p>

        <h2 className="font-display text-xl font-bold mt-8 mb-4">
          Are you happy to commit to our shared Principles?
        </h2>

        <div className="space-y-3">
          {principles.map((p, i) => (
            <button
              key={p.title}
              onClick={() => toggle(i)}
              className={`w-full text-left flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                checked[i]
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 bg-white hover:border-foreground/20"
              }`}
            >
              <div
                className={`mt-0.5 w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all duration-300 ${
                  checked[i]
                    ? "bg-primary border-primary"
                    : "border-foreground/20"
                }`}
              >
                {checked[i] && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold">{p.title}</h3>
                {p.lines.map((line, j) => (
                  <p key={j} className="text-sm text-foreground/60 mt-0.5">
                    {line}
                  </p>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={() => router.push("/join/membership")}
            disabled={!allChecked}
            className={`rounded-full px-8 py-3 font-medium transition-all ${
              allChecked
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
            }`}
          >
            Sounds good — I&rsquo;m in
          </button>
          <a
            href="/join/feedback"
            className="rounded-full border border-foreground/20 px-8 py-3 font-medium text-foreground/60 hover:bg-foreground/5 transition-colors text-center"
          >
            Not really
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MemberLink({ name, memberId }) {
  return (
    <a
      href={`/home/members/${memberId}`}
      className="font-medium text-primary hover:underline"
    >
      {name || "A member"}
    </a>
  );
}

// ─── Task Item ──────────────────────────────────────────────
function TaskItem({ task, onComplete, isCompleted, isPersistent }) {
  const [completing, setCompleting] = useState(false);
  const [checked, setChecked] = useState(isCompleted);

  async function handleCheck() {
    if (completing) return;
    setCompleting(true);
    setChecked(true);
    await onComplete(task);
    if (!isPersistent) {
      // Animation handled by parent removing the task
    }
    setCompleting(false);
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border border-foreground/10 bg-white p-4 transition-all duration-500 ${
        checked && !isPersistent ? "opacity-0 translate-x-full" : ""
      }`}
    >
      <button
        onClick={handleCheck}
        disabled={completing || (checked && !isPersistent)}
        className={`mt-0.5 w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all duration-300 ${
          checked
            ? "bg-primary border-primary"
            : "border-foreground/20 hover:border-primary group-hover:border-foreground/30"
        }`}
      >
        {checked && (
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
      </button>
      <div className="flex-1 min-w-0">
        {task.url ? (
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display font-bold text-sm hover:text-primary transition-colors"
          >
            {task.title}
          </a>
        ) : (
          <span className="font-display font-bold text-sm">{task.title}</span>
        )}
        {task.description && (
          <p className="text-xs text-foreground/50 mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
        {task.source === "github" && (
          <span className="inline-block mt-1 text-[10px] bg-foreground/5 text-foreground/40 rounded px-1.5 py-0.5">
            GitHub
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Feed Item ──────────────────────────────────────────────
function FeedItem({ item, isNew }) {
  return (
    <div
      className={`rounded-xl border border-foreground/10 bg-white p-4 transition-all duration-500 ${
        isNew ? "animate-slide-in" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">
          {item.type === "completion" ? "\u2705" : "\u270F\uFE0F"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <MemberLink
              name={item.memberName}
              memberId={item.memberId}
            />{" "}
            {item.type === "completion" ? (
              <>
                completed:{" "}
                <span className="text-foreground/70">{item.text}</span>
              </>
            ) : (
              <span className="text-foreground/70">{item.text}</span>
            )}
          </p>
          <p className="text-xs text-foreground/40 mt-1">
            {timeAgo(item.date)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Help Request Item ──────────────────────────────────────
function HelpRequestItem({ request, memberId, onReply }) {
  const [replying, setReplying] = useState(false);
  const hasReplied = request.help_replies?.some(
    (r) => r.member_id === memberId
  );

  async function handleHelp() {
    setReplying(true);
    await onReply(request.id);
    setReplying(false);
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{"\uD83D\uDE4B"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <MemberLink
              name={request.members?.name}
              memberId={request.member_id}
            />{" "}
            <span className="text-foreground/70">{request.description}</span>
          </p>
          {request.help_replies?.length > 0 && (
            <div className="mt-2 space-y-1">
              {request.help_replies.map((reply) => (
                <p key={reply.id} className="text-xs text-foreground/50">
                  <MemberLink
                    name={reply.members?.name}
                    memberId={reply.member_id}
                  />{" "}
                  can help
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-foreground/40">
              {timeAgo(request.created_at)}
            </p>
            {!hasReplied && !request.is_resolved && (
              <button
                onClick={handleHelp}
                disabled={replying}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                I can help
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── @Mention Input ─────────────────────────────────────────
function MentionInput({ placeholder, buttonLabel, onSubmit, allMembers }) {
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);

    // Check for @ trigger
    const lastAt = val.lastIndexOf("@");
    if (lastAt >= 0) {
      const after = val.slice(lastAt + 1);
      if (!after.includes(" ")) {
        setMentionFilter(after.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  }

  function insertMention(member) {
    const lastAt = text.lastIndexOf("@");
    const before = text.slice(0, lastAt);
    setText(`${before}@${member.name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  }

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);

    // Extract mentioned member IDs
    const mentionedIds = allMembers
      .filter((m) => m.name && text.includes(`@${m.name}`))
      .map((m) => m.id);

    await onSubmit(text.trim(), mentionedIds);
    setText("");
    setSubmitting(false);
  }

  const filtered = showMentions
    ? allMembers.filter(
        (m) =>
          m.name && m.name.toLowerCase().includes(mentionFilter)
      ).slice(0, 5)
    : [];

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none"
      />
      {showMentions && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 rounded-xl border border-foreground/10 bg-white shadow-lg overflow-hidden z-10">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => insertMention(m)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || submitting}
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
      >
        {submitting ? "Saving..." : buttonLabel}
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function CollaborationStation({
  member,
  tasks: initialTasks,
  allTasks,
  completedTaskIds: initialCompleted,
  recentCompletions,
  recentContributions,
  helpRequests: initialHelpRequests,
  allMembers,
  goals,
  ocContributions,
  firstName,
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [completedIds, setCompletedIds] = useState(new Set(initialCompleted));
  const [feedFilter, setFeedFilter] = useState("all");
  const [helpRequests, setHelpRequests] = useState(initialHelpRequests);
  const [newItemIds, setNewItemIds] = useState(new Set());

  // Build feed from completions + contributions
  const feed = [
    ...recentCompletions.map((c) => ({
      id: `comp-${c.id}`,
      type: "completion",
      text: c.tasks?.title || "a task",
      memberName: c.members?.name,
      memberId: c.member_id,
      date: c.completed_at,
    })),
    ...recentContributions.map((c) => ({
      id: `contrib-${c.id}`,
      type: "contribution",
      text: c.description,
      memberName: c.members?.name,
      memberId: c.member_id,
      date: c.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(
      (item) =>
        feedFilter === "all" ||
        (feedFilter === "completions" && item.type === "completion") ||
        (feedFilter === "contributions" && item.type === "contribution")
    )
    .slice(0, 10);

  // Real-time subscriptions
  useEffect(() => {
    const sb = createBrowserClient();

    const channel = sb
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_completions" },
        (payload) => {
          setNewItemIds((prev) => new Set([...prev, `comp-${payload.new.id}`]));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contributions" },
        (payload) => {
          setNewItemIds(
            (prev) => new Set([...prev, `contrib-${payload.new.id}`])
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "help_requests" },
        () => {
          // Refetch help requests for simplicity
          fetch("/api/help-requests")
            .then((r) => r.json())
            .then((data) => {
              if (data.requests) setHelpRequests(data.requests);
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Task completion handler
  const handleTaskComplete = useCallback(
    async (task) => {
      if (!member) return;

      setCompletedIds((prev) => new Set([...prev, task.id]));

      await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });

      // If persistent, pre-fill the I Did... input with suggestion
      if (task.is_persistent) {
        // The task stays in the list but is marked complete
        return;
      }

      // Remove completed task and add next available one
      setTimeout(() => {
        setTasks((prev) => {
          const remaining = prev.filter((t) => t.id !== task.id);
          // Find next task not in current list and not completed
          const nextTask = allTasks.find(
            (t) =>
              !remaining.some((r) => r.id === t.id) &&
              !completedIds.has(t.id) &&
              t.id !== task.id
          );
          if (nextTask) {
            return [...remaining, nextTask].slice(0, 5);
          }
          return remaining;
        });
      }, 500);
    },
    [member, allTasks, completedIds]
  );

  // Contribution submit handler
  async function handleContribution(text, mentionedIds) {
    await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text, mentionedMembers: mentionedIds }),
    });
  }

  // Help request submit handler
  async function handleHelpRequest(text) {
    await fetch("/api/help-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text }),
    });
  }

  // Help reply handler
  async function handleHelpReply(requestId) {
    await fetch("/api/help-requests/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpRequestId: requestId }),
    });
    // Optimistic update
    setHelpRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              help_replies: [
                ...(r.help_replies || []),
                { id: "temp", member_id: member.id, members: { name: member.name } },
              ],
            }
          : r
      )
    );
  }

  // Stats for momentum strip
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekCompletions = recentCompletions.filter(
    (c) => c.completed_at > weekAgo
  ).length;
  const weekContributions = recentContributions.filter(
    (c) => c.created_at > weekAgo
  ).length;
  const weekTotal = weekCompletions + weekContributions;
  const activeMembers = new Set([
    ...recentCompletions.filter((c) => c.completed_at > weekAgo).map((c) => c.member_id),
    ...recentContributions.filter((c) => c.created_at > weekAgo).map((c) => c.member_id),
  ]).size;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-1">
        {firstName ? `Hi, ${firstName}` : "Collaboration Station"}
      </h1>
      <p className="text-foreground/50 mb-8">
        Welcome to The Open Co-op&rsquo;s Collaboration Station
      </p>

      {/* 3-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Things You Can Do */}
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            Things You Can Do
          </h2>
          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  isCompleted={completedIds.has(task.id)}
                  isPersistent={task.is_persistent}
                />
              ))
            ) : (
              <p className="text-sm text-foreground/50 py-4">
                You&rsquo;ve done everything on the list! Check back soon or log
                a contribution below.
              </p>
            )}
          </div>

          {/* What's being funded */}
          {goals.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-sm font-bold mb-3 text-foreground/60">
                What&rsquo;s being funded
              </h3>
              <div className="space-y-3">
                {goals.map((goal) => {
                  const pct = Math.min(
                    100,
                    Math.round((goal.raised / goal.target) * 100)
                  );
                  return (
                    <a
                      key={goal.slug || goal.name}
                      href={`https://opencollective.com/open-coop/projects/${goal.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-foreground/10 bg-white p-3 hover:border-foreground/20 transition-colors"
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-foreground/40">
                          {formatCurrency(goal.raised, goal.currency)} /{" "}
                          {formatCurrency(goal.target, goal.currency)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Middle: Things We've Done */}
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            Things We&rsquo;ve Done
          </h2>

          <MentionInput
            placeholder="What did you contribute today?"
            buttonLabel="Log contribution"
            onSubmit={handleContribution}
            allMembers={allMembers}
          />

          {/* Filter tabs */}
          <div className="flex gap-2 mt-4 mb-3">
            {["all", "completions", "contributions"].map((f) => (
              <button
                key={f}
                onClick={() => setFeedFilter(f)}
                className={`text-xs rounded-full px-3 py-1 transition-colors ${
                  feedFilter === f
                    ? "bg-primary text-white"
                    : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {feed.length > 0 ? (
              feed.map((item) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  isNew={newItemIds.has(item.id)}
                />
              ))
            ) : (
              <p className="text-sm text-foreground/50 py-4">
                No activity yet. Be the first to log a contribution!
              </p>
            )}
          </div>
        </div>

        {/* Right: Can you help? */}
        <div>
          <h2 className="font-display text-lg font-bold mb-4">
            Can you help?
          </h2>

          <MentionInput
            placeholder="Stuck on something? Ask for help..."
            buttonLabel="Ask for help"
            onSubmit={handleHelpRequest}
            allMembers={allMembers}
          />

          <div className="space-y-3 mt-4">
            {helpRequests.length > 0 ? (
              helpRequests.map((request) => (
                <HelpRequestItem
                  key={request.id}
                  request={request}
                  memberId={member?.id}
                  onReply={handleHelpReply}
                />
              ))
            ) : (
              <p className="text-sm text-foreground/50 py-4">
                No help requests yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Momentum strip */}
      <div className="mt-10 rounded-xl border border-foreground/10 bg-white px-6 py-4 flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/60">
        <span>
          <strong className="text-foreground">{weekTotal}</strong> contributions
          this week
        </span>
        <span className="text-foreground/20">&middot;</span>
        <span>
          <strong className="text-foreground">{activeMembers}</strong> active
          member{activeMembers !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        {[
          { label: "Docs", href: "https://docs.open.coop" },
          {
            label: "GitHub",
            href: "https://github.com/The-Open-Co-op/planet",
          },
          {
            label: "Open Collective",
            href: "https://opencollective.com/open-coop",
          },
          {
            label: "Loomio",
            href: "https://www.loomio.com/the-open-co-op/",
          },
          {
            label: "Google Docs",
            href: "https://drive.google.com/drive/folders/0B5qDh_FMmLtONEFsYWc3Ql9YUWc?resourcekey=0-halS3Ugoii3XhLi8SNrSWQ&usp=sharing",
          },
          {
            label: "Signal",
            href: "https://signal.group/#CjQKIJwCI3LV2CPO8ghXXLwZtUvnp5M8yD08ELtXdkRIWOAEEhC78Ge_s-QrxzdY9AptQCJg",
          },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/40 hover:text-primary transition-colors"
          >
            {link.label} {"\u2197"}
          </a>
        ))}
      </div>
    </div>
  );
}

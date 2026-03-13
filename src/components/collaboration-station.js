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
function FeedItem({ item, isNew, isOwn, onUndo }) {
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
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-foreground/40">
              {timeAgo(item.date)}
            </p>
            {isOwn && onUndo && (
              <button
                onClick={() => onUndo(item)}
                className="text-xs text-foreground/30 hover:text-primary transition-colors"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Icon ────────────────────────────────────────────
function ContactIcon({ memberId }) {
  if (!memberId) return null;
  return (
    <a
      href={`/home/members/${memberId}`}
      title="Contact"
      className="inline-flex items-center ml-1.5 text-foreground/30 hover:text-primary transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    </a>
  );
}

// ─── Help Request Item ──────────────────────────────────────
function HelpRequestItem({ request, memberId, onReply, onDelete }) {
  const [replying, setReplying] = useState(false);
  const hasReplied = request.help_replies?.some(
    (r) => r.member_id === memberId
  );
  const isOwn = request.member_id === memberId;

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
            />
            <ContactIcon memberId={request.member_id} />
            {" "}
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
                  <ContactIcon memberId={reply.member_id} />
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-foreground/40">
              {timeAgo(request.created_at)}
            </p>
            {!hasReplied && !request.is_resolved && !isOwn && (
              <button
                onClick={handleHelp}
                disabled={replying}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                I can help
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => onDelete(request.id)}
                className="text-xs text-foreground/30 hover:text-primary transition-colors"
              >
                Delete
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
  const [helpRequests, setHelpRequests] = useState(initialHelpRequests);
  const [newItemIds, setNewItemIds] = useState(new Set());
  const [feedItems, setFeedItems] = useState([
    ...recentCompletions.map((c) => ({
      id: `comp-${c.id}`,
      type: "completion",
      text: c.tasks?.title || "a task",
      taskId: c.task_id,
      taskObj: allTasks.find((t) => t.id === c.task_id) || null,
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
  ].sort((a, b) => new Date(b.date) - new Date(a.date)));

  const feed = feedItems.slice(0, 20);

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
        (payload) => {
          // Only add if not already in state (avoids duplicating our own optimistic items)
          setHelpRequests((prev) => {
            const exists = prev.some(
              (r) => r.id === payload.new.id || r.description === payload.new.description
            );
            if (exists) return prev;
            return [
              {
                ...payload.new,
                members: { name: null },
                help_replies: [],
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Remove a task from the list and replace with next available
  const removeTask = useCallback(
    (taskId) => {
      setTasks((prev) => {
        const remaining = prev.filter((t) => t.id !== taskId);
        const nextTask = allTasks.find(
          (t) =>
            !remaining.some((r) => r.id === t.id) &&
            !completedIds.has(t.id) &&
            t.id !== taskId
        );
        if (nextTask) return [...remaining, nextTask].slice(0, 5);
        return remaining;
      });
    },
    [allTasks, completedIds]
  );

  // Task completion handler
  const handleTaskComplete = useCallback(
    async (task) => {
      if (!member) return;

      setCompletedIds((prev) => new Set([...prev, task.id]));

      // Optimistic feed update
      const tempId = `comp-temp-${Date.now()}`;
      setFeedItems((prev) => [
        {
          id: tempId,
          type: "completion",
          text: task.title,
          taskId: task.id,
          taskObj: task,
          memberName: member?.name || firstName,
          memberId: member?.id,
          date: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewItemIds((prev) => new Set([...prev, tempId]));

      await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });

      if (task.is_persistent) return;

      // Remove completed task and replace with next
      setTimeout(() => removeTask(task.id), 500);
    },
    [member, removeTask]
  );

  // Undo a feed item (completion or contribution)
  const handleFeedUndo = useCallback(
    async (item) => {
      // Remove from feed
      setFeedItems((prev) => prev.filter((f) => f.id !== item.id));

      if (item.type === "completion" && item.taskId) {
        // Restore the task to the todo list
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.taskId);
          return next;
        });
        if (item.taskObj) {
          setTasks((prev) =>
            prev.some((t) => t.id === item.taskObj.id) ? prev : [item.taskObj, ...prev].slice(0, 5)
          );
        }
        await fetch("/api/tasks/complete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: item.taskId }),
        });
      } else if (item.type === "contribution") {
        // Extract numeric DB id from "contrib-123" or "contrib-temp-..."
        const dbId = item.id.replace("contrib-", "").replace("temp-", "");
        await fetch("/api/contributions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: dbId, description: item.text }),
        });
      }
    },
    []
  );

  // Contribution submit handler
  async function handleContribution(text, mentionedIds) {
    // Optimistic update — show immediately
    const tempId = `contrib-temp-${Date.now()}`;
    const newItem = {
      id: tempId,
      type: "contribution",
      text,
      memberName: member?.name || firstName,
      memberId: member?.id,
      date: new Date().toISOString(),
    };
    setFeedItems((prev) => [newItem, ...prev]);
    setNewItemIds((prev) => new Set([...prev, tempId]));

    await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text, mentionedMembers: mentionedIds }),
    });
  }

  // Help request submit handler
  async function handleHelpRequest(text) {
    // Optimistic update
    const tempRequest = {
      id: `temp-${Date.now()}`,
      member_id: member?.id,
      description: text,
      is_resolved: false,
      members: { name: member?.name || firstName },
      help_replies: [],
      created_at: new Date().toISOString(),
    };
    setHelpRequests((prev) => [tempRequest, ...prev]);

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

  // Help request delete handler
  async function handleHelpDelete(requestId) {
    setHelpRequests((prev) => prev.filter((r) => r.id !== requestId));
    await fetch("/api/help-requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId }),
    });
  }

  // Stats for momentum strip (derived from live feedItems state)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekItems = feedItems.filter((item) => item.date > weekAgo);
  const weekTotal = weekItems.length;
  const activeMembers = new Set(
    weekItems.map((item) => item.memberId).filter(Boolean)
  ).size;

  return (
    <div className="lg:h-[calc(100vh-80px)] lg:flex lg:flex-col">
      <h1 className="font-display text-3xl font-bold mb-1">
        {firstName ? `Hi, ${firstName}` : "Collaboration Station"}
      </h1>
      <p className="text-foreground/50 mb-4">
        Welcome to The Open Co-op&rsquo;s Collaboration Station
      </p>

      {/* 3-column layout */}
      <div className="grid gap-6 lg:grid-cols-3 lg:flex-1 lg:min-h-0">
        {/* Left: Things You Can Do */}
        <div className="lg:overflow-y-auto lg:pr-1">
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
        <div className="lg:overflow-y-auto lg:pr-1 flex flex-col">
          <h2 className="font-display text-lg font-bold mb-4">
            Things We&rsquo;ve Done
          </h2>

          <MentionInput
            placeholder="What did you contribute today?"
            buttonLabel="Log contribution"
            onSubmit={handleContribution}
            allMembers={allMembers}
          />

          <div className="space-y-2 mt-4 flex-1 overflow-y-auto">
            {feed.length > 0 ? (
              feed.map((item) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  isNew={newItemIds.has(item.id)}
                  isOwn={item.memberId === member?.id}
                  onUndo={handleFeedUndo}
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
        <div className="lg:overflow-y-auto lg:pr-1 flex flex-col">
          <h2 className="font-display text-lg font-bold mb-4">
            Can you help?
          </h2>

          <MentionInput
            placeholder="Stuck on something? Ask for help..."
            buttonLabel="Ask for help"
            onSubmit={handleHelpRequest}
            allMembers={allMembers}
          />

          <div className="space-y-3 mt-4 flex-1 overflow-y-auto">
            {helpRequests.length > 0 ? (
              helpRequests.map((request) => (
                <HelpRequestItem
                  key={request.id}
                  request={request}
                  memberId={member?.id}
                  onReply={handleHelpReply}
                  onDelete={handleHelpDelete}
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
      <div className="mt-4 shrink-0 rounded-xl border border-foreground/10 bg-white px-6 py-3 flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/60">
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
      <div className="mt-2 shrink-0 flex flex-wrap justify-center gap-4 text-sm">
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

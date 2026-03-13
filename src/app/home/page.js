export const dynamic = "force-dynamic";

import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { getIssuesByLabels } from "@/lib/github";
import { getGoals, getRecentContributions } from "@/lib/opencollective";
import CollaborationStation from "@/components/collaboration-station";

export default async function DashboardPage() {
  noStore();
  const session = await auth();
  const email = session?.user?.email;

  // Fetch member data and all dashboard data in parallel
  const [member, tasks, goals, ocContributions, githubIssues] =
    await Promise.all([
      supabase
        .from("members")
        .select("*")
        .eq("email", email)
        .limit(1)
        .single()
        .then((r) => r.data),
      supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .then((r) => r.data || []),
      getGoals().catch(() => []),
      getRecentContributions(5).catch(() => []),
      getIssuesByLabels(20).catch(() => []),
    ]);

  // Get this member's completed task IDs
  let completedTaskIds = [];
  if (member) {
    const { data } = await supabase
      .from("task_completions")
      .select("task_id")
      .eq("member_id", member.id);
    completedTaskIds = (data || []).map((tc) => tc.task_id);
  }

  // Get recent feed items (task completions + contributions + help requests)
  const [recentCompletions, recentContributions, helpRequests] =
    await Promise.all([
      supabase
        .from("task_completions")
        .select("*, members(name), tasks(title)")
        .order("completed_at", { ascending: false })
        .limit(20)
        .then((r) => r.data || []),
      supabase
        .from("contributions")
        .select("*, members(name)")
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r) => r.data || []),
      supabase
        .from("help_requests")
        .select("*, members(name), help_replies(*, members(name))")
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r) => r.data || []),
    ]);

  // Get member list for @mentions
  const { data: allMembers } = await supabase
    .from("members")
    .select("id, name, email")
    .order("name");

  // Sync GitHub issues into tasks table (lightweight — just inserts new ones)
  for (const issue of githubIssues) {
    const exists = tasks.some(
      (t) => t.source === "github" && t.github_issue_number === issue.number
    );
    if (!exists) {
      const category = issue.labels.includes("governance")
        ? "governance"
        : issue.labels.includes("product")
          ? "product"
          : issue.labels.includes("outreach")
            ? "outreach"
            : issue.labels.includes("business")
              ? "business"
              : "product";

      const { data: newTask } = await supabase
        .from("tasks")
        .insert({
          title: issue.title,
          description: issue.body,
          url: issue.url,
          category,
          source: "github",
          github_issue_url: issue.url,
          github_issue_number: issue.number,
          is_universal: issue.labels.includes("help-wanted"),
        })
        .select()
        .single();

      if (newTask) tasks.push(newTask);
    }
  }

  // Filter tasks for this member
  const memberInterests = member?.interests || [];
  const isFollower =
    memberInterests.length === 0 ||
    (memberInterests.length === 1 && memberInterests[0] === "following");

  const filteredTasks = tasks.filter((task) => {
    // Already completed (and not persistent)
    if (completedTaskIds.includes(task.id) && !task.is_persistent) return false;
    // Universal tasks shown to everyone
    if (task.is_universal) return true;
    // Followers only see universal tasks
    if (isFollower) return false;
    // Match by category to interests
    return memberInterests.includes(task.category);
  });

  return (
    <CollaborationStation
      member={member}
      tasks={filteredTasks.slice(0, 5)}
      allTasks={filteredTasks}
      completedTaskIds={completedTaskIds}
      recentCompletions={recentCompletions}
      recentContributions={recentContributions}
      helpRequests={helpRequests}
      allMembers={allMembers || []}
      goals={goals}
      ocContributions={ocContributions}
      firstName={session?.user?.name?.split(" ")[0]}
    />
  );
}

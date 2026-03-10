const ORG = "The-Open-Co-op";
const REPO = "planet-site";

function headers() {
  const h = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: headers(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error("GitHub API error:", res.status, path);
    return null;
  }

  return res.json();
}

export async function getHelpWantedIssues(limit = 5) {
  const data = await ghFetch(
    `/repos/${ORG}/${REPO}/issues?labels=help-wanted,good-first-issue&state=open&per_page=${limit}&sort=updated`
  );

  if (!data) return [];

  return data.map((issue) => ({
    title: issue.title,
    body: issue.body?.slice(0, 120) || "",
    url: issue.html_url,
    labels: issue.labels.map((l) => l.name),
    updatedAt: issue.updated_at,
  }));
}

export async function getRecentActivity(limit = 5) {
  const data = await ghFetch(
    `/repos/${ORG}/${REPO}/events?per_page=${limit}`
  );

  if (!data) return [];

  return data
    .filter((e) =>
      ["PushEvent", "PullRequestEvent", "IssuesEvent"].includes(e.type)
    )
    .slice(0, limit)
    .map((event) => {
      let description = "";
      if (event.type === "PushEvent") {
        const commits = event.payload.commits?.length || 0;
        description = `${commits} commit${commits !== 1 ? "s" : ""} pushed`;
      } else if (event.type === "PullRequestEvent") {
        description = `PR ${event.payload.action}: ${event.payload.pull_request?.title || ""}`;
      } else if (event.type === "IssuesEvent") {
        description = `Issue ${event.payload.action}: ${event.payload.issue?.title || ""}`;
      }

      return {
        type: event.type,
        actor: event.actor?.login || "unknown",
        description,
        date: event.created_at,
        url:
          event.payload.pull_request?.html_url ||
          event.payload.issue?.html_url ||
          `https://github.com/${ORG}/${REPO}`,
      };
    });
}

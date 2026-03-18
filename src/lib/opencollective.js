const OC_API = "https://api.opencollective.com/graphql/v2";
const COLLECTIVE_SLUG = "open-coop";

async function ocQuery(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.OPEN_COLLECTIVE_API_KEY) {
    headers["Api-Key"] = process.env.OPEN_COLLECTIVE_API_KEY;
  }

  const res = await fetch(OC_API, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!res.ok) {
    console.error("Open Collective API error:", res.status);
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error("Open Collective GraphQL errors:", json.errors);
    return null;
  }

  return json.data;
}

export async function getCollectiveStats() {
  const data = await ocQuery(`
    query {
      account(slug: "${COLLECTIVE_SLUG}") {
        stats {
          balance { value currency }
          yearlyBudget { value currency }
          totalAmountReceived { value currency }
          contributorsCount
        }
      }
    }
  `);

  if (!data?.account?.stats) {
    return { balance: 0, yearlyBudget: 0, totalRaised: 0, currency: "GBP", memberCount: 0 };
  }

  const { balance, yearlyBudget, totalAmountReceived, contributorsCount } = data.account.stats;
  return {
    balance: balance.value,
    yearlyBudget: yearlyBudget.value,
    totalRaised: totalAmountReceived?.value || 0,
    currency: balance.currency,
    memberCount: contributorsCount,
  };
}

export async function getGoals() {
  const data = await ocQuery(`
    query {
      account(slug: "${COLLECTIVE_SLUG}") {
        childrenAccounts(accountType: PROJECT) {
          nodes {
            name
            description
            slug
            stats {
              balance { value currency }
              contributorsCount
            }
            settings
          }
        }
      }
    }
  `);

  if (!data?.account?.childrenAccounts?.nodes) {
    return [];
  }

  return data.account.childrenAccounts.nodes
    .filter((project) => project.settings?.goals?.[0]?.amount > 0)
    .map((project) => {
      const goal = project.settings.goals[0];
      return {
        name: project.name,
        description: project.description,
        slug: project.slug,
        target: goal.amount / 100, // OC stores goals in cents
        raised: project.stats.balance.value,
        currency: project.stats.balance.currency,
        contributors: project.stats.contributorsCount,
      };
    });
}

export async function getRecentContributions(limit = 3) {
  const data = await ocQuery(`
    query {
      account(slug: "${COLLECTIVE_SLUG}") {
        transactions(type: CREDIT, limit: ${limit}, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes {
            createdAt
            amount { value currency }
            fromAccount {
              name
              slug
              imageUrl
            }
            description
          }
        }
      }
    }
  `);

  if (!data?.account?.transactions?.nodes) {
    return [];
  }

  return data.account.transactions.nodes.map((t) => ({
    date: t.createdAt,
    amount: t.amount.value,
    currency: t.amount.currency,
    from: t.fromAccount?.name || "Anonymous",
    description: t.description,
  }));
}

export async function getMembers(limit = 100) {
  const data = await ocQuery(`
    query {
      account(slug: "${COLLECTIVE_SLUG}") {
        members(role: BACKER, limit: ${limit}) {
          nodes {
            account {
              name
              slug
              imageUrl
              createdAt
            }
            createdAt
          }
        }
      }
    }
  `);

  if (!data?.account?.members?.nodes) {
    return [];
  }

  return data.account.members.nodes.map((m) => ({
    name: m.account.name,
    slug: m.account.slug,
    imageUrl: m.account.imageUrl,
    joinedAt: m.createdAt,
  }));
}

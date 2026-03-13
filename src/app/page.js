import { getCollectiveStats, getGoals } from "@/lib/opencollective";

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home() {
  const [stats, goals] = await Promise.all([
    getCollectiveStats().catch(() => null),
    getGoals().catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl max-w-3xl">
          What if you actually owned your corner of the internet?
        </h1>
        <p className="mt-6 text-lg text-foreground/70 max-w-2xl">
          PLANET is a personal trust vault and network client — built by a
          cooperative, owned by its members.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="/join"
            className="rounded-full bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Join us
          </a>
          <a
            href="/login"
            className="rounded-full border border-foreground/20 px-8 py-3 font-medium hover:bg-foreground/5 transition-colors"
          >
            Sign in
          </a>
        </div>
        {stats && (
          <div className="mt-12 flex gap-8 text-sm text-foreground/50">
            <span>{stats.memberCount} members</span>
            <span>&middot;</span>
            <span>{formatCurrency(stats.balance, stats.currency)} balance</span>
            {goals.length > 0 && (
              <>
                <span>&middot;</span>
                <span>{goals.length} features being funded</span>
              </>
            )}
          </div>
        )}
      </section>

      {/* Vision */}
      <section id="vision" className="px-6 py-24 max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-bold mb-6">The Vision</h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          Imagine a digital world where everyone is real. Where your data is
          yours. Where communities govern themselves. Where the infrastructure is
          commons, held in trust for future generations. Where the whole point of
          the technology is to get you back offline, living your life.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-foreground/80">
          We&apos;re building this. The technology exists. The community is
          forming.{" "}
          <a href="#join" className="text-primary hover:underline">
            Here&apos;s how you can be part of it.
          </a>
        </p>
      </section>

      {/* What We're Building */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-6">
            What We&apos;re Building
          </h2>
          <p className="text-lg leading-relaxed text-foreground/80">
            PLANET is a work in progress. It will be a trust vault, a network
            client, and a set of apps built on open protocols owned by no one.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Right now, we&apos;re designing the experience, building working
            demos, and gathering the community that will bring this to life.
          </p>
          <a
            href="https://docs.open.coop"
            className="inline-block mt-6 text-primary hover:underline font-medium"
          >
            Read the full vision, technology, and roadmap &rarr;
          </a>
        </div>
      </section>

      {/* The Evidence */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-8">
            The Evidence
          </h2>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              <div className="rounded-xl border border-foreground/10 bg-white p-6">
                <p className="font-display text-3xl font-bold text-primary">
                  {stats.memberCount}
                </p>
                <p className="mt-1 text-sm text-foreground/60">Members</p>
              </div>
              <div className="rounded-xl border border-foreground/10 bg-white p-6">
                <p className="font-display text-3xl font-bold text-primary">
                  {formatCurrency(stats.balance, stats.currency)}
                </p>
                <p className="mt-1 text-sm text-foreground/60">Balance</p>
              </div>
              <div className="rounded-xl border border-foreground/10 bg-white p-6">
                <p className="font-display text-3xl font-bold text-primary">
                  80,000+
                </p>
                <p className="mt-1 text-sm text-foreground/60">
                  <a
                    href="https://cobot.murmurations.network/"
                    className="hover:text-primary"
                  >
                    Organisations mapped in the regenerative economy
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Goal progress bars */}
          {goals.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-bold">
                Feature bounties
              </h3>
              {goals.map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((goal.raised / goal.target) * 100)
                );
                return (
                  <a
                    key={goal.slug || goal.name}
                    href={`https://opencollective.com/open-coop/projects/${goal.slug}`}
                    className="block"
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium hover:text-primary">{goal.name}</span>
                      <span className="text-sm text-foreground/60">
                        {formatCurrency(goal.raised, goal.currency)} /{" "}
                        {formatCurrency(goal.target, goal.currency)}
                        {" · "}
                        {goal.contributors} backer
                        {goal.contributors !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </a>
                );
              })}
              <a
                href="https://opencollective.com/open-coop/projects"
                className="inline-block mt-2 text-primary hover:underline font-medium"
              >
                Fund a feature &rarr;
              </a>
            </div>
          )}
        </div>
      </section>

      {/* The Co-op */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-6">The Co-op</h2>
          <p className="text-lg leading-relaxed text-foreground/80">
            PLANET is operated by The Open Co-op — a cooperative owned by its
            members. No shareholders, no venture capital, no exit strategy.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Inspired by the Well-being of Future Generations Act, we make a
            voluntary commitment to build infrastructure held in trust across
            generations, not optimised for short-term returns.
          </p>
          <a
            href="https://docs.open.coop/planet/the-co-op"
            className="inline-block mt-6 text-primary hover:underline font-medium"
          >
            Read more about the co-op &rarr;
          </a>
        </div>
      </section>

      {/* Join */}
      <section id="join" className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Join</h2>
          <p className="text-lg text-foreground/70 mb-10">
            Membership is free. If you can support the project financially,
            choose what works for you.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Free",
                price: "£0/month",
                href: "https://opencollective.com/open-coop/contribute/free-99617/checkout?interval=month&amount=0&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
              },
              {
                label: "Pioneer",
                price: "£5/month",
                href: "https://opencollective.com/open-coop/contribute/planet-pioneer-14003/checkout?interval=month&amount=500&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
              },
              {
                label: "Pioneer+",
                price: "£10/month",
                href: "https://opencollective.com/open-coop/contribute/planet-pioneer-61741/checkout?interval=month&amount=1000&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
              },
              {
                label: "Catalyst",
                price: "£50/month",
                href: "https://opencollective.com/open-coop/contribute/catalyst-14004/checkout?interval=month&amount=5000&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
              },
            ].map((tier) => (
              <a
                key={tier.label}
                href={tier.href}
                className="flex flex-col items-center rounded-xl border border-foreground/10 bg-white p-6 hover:border-primary transition-colors"
              >
                <span className="font-display text-lg font-bold">
                  {tier.label}
                </span>
                <span className="mt-2 text-foreground/60">{tier.price}</span>
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm text-foreground/50">
            Every member gets the same voice regardless of what they pay.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-foreground/10">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="/login" className="hover:text-primary">
              Sign in
            </a>
            <a href="https://docs.open.coop" className="hover:text-primary">
              Docs
            </a>
            <a
              href="https://github.com/The-Open-Co-op"
              className="hover:text-primary"
            >
              GitHub
            </a>
            <a
              href="https://opencollective.com/open-coop"
              className="hover:text-primary"
            >
              Open Collective
            </a>
            <a href="https://open.coop" className="hover:text-primary">
              open.coop
            </a>
          </div>
          <p className="text-sm text-foreground/50">
            &copy; The Open Co-op
          </p>
        </div>
      </footer>
    </div>
  );
}

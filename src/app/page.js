import { getCollectiveStats } from "@/lib/opencollective";

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home() {
  const stats = await getCollectiveStats().catch(() => null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 min-h-screen text-center bg-contain bg-center bg-no-repeat bg-black" style={{ backgroundImage: "url('/earth.jpg')" }}>
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10">
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight md:text-8xl max-w-5xl leading-tight mb-4 text-white mx-auto">
            Join the collaboration<br /> to build PLANET
          </h1>
          <p className="mt-6 text-lg sm:text-xl font-bold text-white/80 max-w-2xl leading-relaxed mx-auto md:text-2xl">
            A decentralised trust network for the regenerative economy
            &mdash;&nbsp;owned and governed by its members.
          </p>
          <p className="mt-4 text-lg sm:text-xl font-bold text-white/80 md:text-2xl">
            No billionaires. No ads. No BS.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <a
              href="/join"
              className="font-display rounded-full bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
            >
              Join us
            </a>
            <a
              href="/login"
              className="font-display rounded-full bg-white/20 border border-white/40 px-8 py-3 font-medium text-white hover:bg-white/30 transition-colors"
            >
              Sign in
            </a>
          </div>
          {stats && (
            <div className="mt-14 flex gap-12 justify-center">
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-white">
                  {stats.memberCount}
                </p>
                <p className="mt-1 text-sm font-medium text-white/60 uppercase tracking-wide">
                  Members
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-white">
                  {formatCurrency(stats.totalRaised, stats.currency)}
                </p>
                <p className="mt-1 text-sm font-medium text-white/60 uppercase tracking-wide">
                  Raised
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* The Vision */}
      <section id="about" className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-bold mb-6">The Vision</h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          Imagine a digital world where you can verify people are real and every
          connection is genuine. Where your data lives in a vault you control
          &mdash; not on someone else&apos;s servers. Where communities own the
          tools they need to govern themselves in the ways they want to help
          their members flourish. Where the technology is designed to support
          your wellbeing and then get out of your way.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-foreground/80">
          Imagine that this infrastructure is a commons &mdash; built
          collaboratively, held in trust for future generations, and owned by
          the people who use it. Not by billionaires. Not by venture capital.
          By&nbsp;us.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-foreground/80 font-medium">
          That&apos;s PLANET &mdash; the system we&apos;re building right now.
        </p>
        </div>
      </section>

      {/* What We're Building */}
      <section id="building" className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-8">
            What is PLANET?
          </h2>
          <p className="text-lg leading-relaxed text-foreground/80">
            PLANET is a personal data vault and trust network client built on
            the <a href="https://www.firstperson.network/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">First Person Project</a>&apos;s infrastructure &mdash; decentralised
            identifiers, verifiable credentials, and end-to-end encrypted
            private channels. Decades of foundational work is now coming together and
            being assembled into a practical tool people can use.
          </p>

          <div className="mt-12 space-y-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Vault
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Your vault stores your identity, contacts, documents, and photos &mdash;
                encrypted, on your device and fully portable. No company controls it.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Network
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                The network connects you to real people through verifiable trust
                relationships. Everyone on PLANET is invited by someone real.
                Trust builds naturally through everyday interactions &mdash;
                messaging, introductions and vouches.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">Apps</h3>
              <p className="text-foreground/70 leading-relaxed">
                Contacts, chat, blogs, introductions, and community tools build
                on the underlying trust infrastructure to deliver secure,
                reliable functionality &mdash; thanks to the
                cryptographically verifiable trust architecture. Developers can
                design and launch new apps on the same infrastructure.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                The Co-op
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                PLANET is owned and governed by the members of <a href="https://open.coop/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">The Open Co-op</a>.
                Every member has a vote. Every penny is transparent. As a member
                you can feedback on the current product and help decide what
                gets built.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Why PLANET? */}
      <section id="evidence" className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-4">
            Why PLANET?
          </h2>
          <p className="text-lg text-foreground/60 mb-10">
            Other projects have promised to fix the internet. So, we
            understand you might be sceptical. Here&apos;s what we have that they
            didn&apos;t:
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                A proven technology stack
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                The <a href="https://www.firstperson.network/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">First Person Project</a> &mdash; backed by the <a href="https://www.linuxfoundation.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Linux Foundation</a>,
                <a href="https://trustoverip.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Trust Over IP</a>, <a href="https://ayra.forum/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ayra</a>, and a global consortium &mdash; is building the
                protocol infrastructure.{" "}
                <a
                  href="https://www.lfdecentralizedtrust.org/blog/decentralized-trust-infrastructure-at-lf-a-progress-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Read the latest Progress Report
                </a>{" "}
                for more background on the tech &mdash; and why the Linux Kernel
                Maintainers are looking to adopt the same technology to improve
                their security.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Twenty years of groundwork
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                The Open Co-op has been championing cooperative ownership and
                designing collaborative infrastructure <a href="https://open.coop/history/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">since 2004</a>. PLANET is the
                culmination of two decades of work on decentralised identity,
                trust networks, and the regenerative economy.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Radical transparency
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Every penny that comes in and goes out of The Open Co-op is
                visible on{" "}
                <a
                  href="https://opencollective.com/open-coop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open Collective
                </a>
                . Every decision is documented. Every line of code is open
                source.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                A cooperative structure
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                No investors expecting returns. No board optimising for exit. No
                future in which the incentives flip against the users. The Open
                Co-op is structurally incapable of <a href="https://en.wikipedia.org/wiki/Enshittification" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">enshittification</a>.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                An existing ecosystem
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                We&apos;re not building for a hypothetical audience &mdash; the
                communities exist and we know how to reach them. We&apos;ve
                already mapped 80,000 organisations in the regenerative economy
                through{" "}
                <a
                  href="https://cobot.murmurations.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  CoBot
                </a>
                . 30,000 of them are already discoverable through{" "}
                <a
                  href="https://murmurations.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Murmurations
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Need */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 leading-snug">
            PLANET is a collaboration. We need you.
          </h2>
          <p className="text-lg leading-relaxed text-foreground/80 mb-6">
            PLANET is being built by a community &mdash; people who share the
            vision and want to contribute what they can.
          </p>
          <p className="text-lg leading-relaxed text-foreground/80 mb-10 font-medium">
            We&apos;re targeting a beta launch in late 2026. Between now and
            then, there&apos;s a lot to build.
          </p>
          <p className="text-lg leading-relaxed text-foreground/80 mb-10 font-medium">
            Right now, we&apos;re:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Designing the experience
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Specifying the user flows and prototyping the apps to make PLANET
                something people will actually want to use every day.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Building working demos
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Coded prototypes of the vault, contacts, chat, blogs, and other
                apps that will plug into the trust infrastructure when it&apos;s
                ready.{" "}
                <a href="https://planet-sepia.vercel.app/#/demo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Check out the current demo!</a>
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Growing the community
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Gathering early adopters, contributors, and founding communities
                so we launch with real momentum, not an empty network.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">
                Evolving the co-op
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                Developing our funding and governance models that will grow with
                the membership, so that by the time PLANET launches, we have a
                mature, democratic organisation.
              </p>
            </div>
          </div>

          <p className="mt-10 text-lg leading-relaxed text-foreground/80">
            We need people who can design, code, write, organise, strategise,
            test, translate, spread the word, and who want to be part of a new,
            regenerative economy built on trust.
          </p>
          <p className="mt-4 text-foreground/70 leading-relaxed">
            When you join, you get access to The Open Co-op&apos;s Collaboration
            Station &mdash; a live workspace where you can see what&apos;s
            happening, pick up tasks, log contributions, and watch the project
            come together in real time alongside other members.
          </p>
        </div>
      </section>

      {/* Join */}
      <section id="join" className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-snug">
            Membership is free. Support is welcome.<br /> Every voice is&nbsp;equal.
          </h2>
          <p className="text-lg text-foreground/70 mb-10 max-w-2xl mx-auto">
            Join The Open Co-op and become part of the founding generation of
            PLANET. Whether you contribute code, ideas, community connections,
            or financial support &mdash; every member gets the same voice.
          </p>
          <a
            href="/join"
            className="font-display inline-block rounded-full bg-primary px-10 py-4 text-white text-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Join The Open Co-op &rarr;
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-black text-white/60">
        <div className="max-w-3xl mx-auto flex justify-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-white/80">
            <a href="/login" className="hover:text-primary">
              Sign in
            </a>
            <a href="https://docs.open.coop" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Docs
            </a>
            <a
              href="https://github.com/The-Open-Co-op"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              GitHub
            </a>
            <a
              href="https://opencollective.com/open-coop"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              Open Collective
            </a>
            <a href="https://open.coop" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              open.coop
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

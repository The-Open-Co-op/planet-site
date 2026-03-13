const tiers = [
  {
    label: "Free",
    price: "£0/month",
    description: "Full membership, no cost",
    href: "https://opencollective.com/open-coop/contribute/free-99617/checkout?interval=month&amount=0&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
  },
  {
    label: "Pioneer",
    price: "£5/month",
    description: "Support the mission",
    href: "https://opencollective.com/open-coop/contribute/planet-pioneer-14003/checkout?interval=month&amount=500&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
  },
  {
    label: "Pioneer+",
    price: "£10/month",
    description: "Go further",
    href: "https://opencollective.com/open-coop/contribute/planet-pioneer-61741/checkout?interval=month&amount=1000&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
  },
  {
    label: "Catalyst",
    price: "£50/month",
    description: "Accelerate the vision",
    href: "https://opencollective.com/open-coop/contribute/catalyst-14004/checkout?interval=month&amount=5000&name=&legalName=&email=&redirect=https://collab.open.coop/welcome",
  },
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-2xl w-full">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Choose your membership level
        </h1>
        <p className="mt-6 text-lg text-foreground/70">
          Membership is free. If you can support the project financially,
          choose what works for you. Every member gets the same voice
          regardless of what they pay.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          {tiers.map((tier) => (
            <a
              key={tier.label}
              href={tier.href}
              className="flex flex-col items-center rounded-xl border-2 border-foreground/10 bg-white p-8 hover:border-primary transition-all text-center"
            >
              <span className="font-display text-2xl font-bold">
                {tier.label}
              </span>
              <span className="mt-2 text-lg text-primary font-medium">
                {tier.price}
              </span>
              <span className="mt-1 text-sm text-foreground/50">
                {tier.description}
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-foreground/40">
          You&rsquo;ll be taken to Open Collective to complete your membership.
        </p>
      </div>
    </div>
  );
}

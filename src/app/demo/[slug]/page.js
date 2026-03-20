import { auth } from "@/auth";
import DemoClient from "@/components/demo-client";

const demos = {
  "planet-onboarding": {
    title: "PLANET Onboarding Demo",
    url: "https://planet-sepia.vercel.app/#/demo",
  },
};

export default async function DemoPage({ params }) {
  const { slug } = await params;
  const demo = demos[slug];

  if (!demo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">Demo not found.</p>
      </div>
    );
  }

  const session = await auth();

  return (
    <DemoClient
      demoSlug={slug}
      demoTitle={demo.title}
      demoUrl={demo.url}
      user={session?.user || null}
    />
  );
}

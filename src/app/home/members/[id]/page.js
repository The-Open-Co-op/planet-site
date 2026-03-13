import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import ContactForm from "@/components/contact-form";
import { slugify } from "@/lib/utils";

export default async function MemberDetailPage({ params }) {
  const { id } = await params;
  const session = await auth();

  // Try UUID first, then match by slugified name
  let member;
  const isUuid = /^[0-9a-f]{8}-/.test(id);
  if (isUuid) {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .limit(1)
      .single();
    member = data;
  } else {
    const { data: allMembers } = await supabase
      .from("members")
      .select("*");
    member = (allMembers || []).find(
      (m) => slugify(m.name) === id
    );
  }

  if (!member) return notFound();

  // Get this member's contributions and completed tasks
  const [{ data: contributions }, { data: completions }] = await Promise.all([
    supabase
      .from("contributions")
      .select("*")
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("task_completions")
      .select("*, tasks(title)")
      .eq("member_id", id)
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  const showContact = member.show_contact_details;
  const isOwnProfile = session?.user?.email === member.email;

  return (
    <div className="max-w-2xl">
      <a
        href="/home/members"
        className="text-sm text-foreground/40 hover:text-primary transition-colors"
      >
        &larr; All members
      </a>

      <div className="flex items-start gap-6 mt-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-foreground/5 overflow-hidden flex items-center justify-center shrink-0">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name || "Member"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-foreground/20">
              {(member.name || "?")[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">
            {member.name || "Member"}
          </h1>
          {member.bio && (
            <p className="text-foreground/60 mt-1">{member.bio}</p>
          )}
          {member.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-foreground/30 mt-2">
            Joined{" "}
            {new Date(member.joined_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {member.oc_tier && member.oc_tier !== "free" && (
              <span className="ml-2 text-foreground/40">
                &middot; {member.oc_tier} member
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Contact details — only if opted in or own profile */}
      {(showContact || isOwnProfile) && (
        <div className="rounded-xl border border-foreground/10 bg-white p-4 mb-6">
          <h3 className="font-display font-bold text-sm mb-2">Contact</h3>
          <p className="text-sm text-foreground/60">{member.email}</p>
          {member.phone && (
            <p className="text-sm text-foreground/60 mt-1">{member.phone}</p>
          )}
          {!showContact && isOwnProfile && (
            <p className="text-xs text-foreground/30 mt-2">
              Only visible to you. Turn on contact sharing in your profile to
              show this to other members.
            </p>
          )}
        </div>
      )}

      {/* Contact form — shown to other members (whether or not contact details are public) */}
      {!isOwnProfile && (
        <ContactForm memberId={member.id} memberName={member.name || "this member"} />
      )}

      {/* Links */}
      {member.links && member.links.length > 0 && (
        <div className="rounded-xl border border-foreground/10 bg-white p-4 mb-6">
          <h3 className="font-display font-bold text-sm mb-2">Links</h3>
          <div className="space-y-1">
            {member.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                {link.label || link.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      <h3 className="font-display font-bold text-sm mb-3 mt-8">Activity</h3>
      <div className="space-y-2">
        {[
          ...(completions || []).map((c) => ({
            text: `Completed: ${c.tasks?.title}`,
            date: c.completed_at,
          })),
          ...(contributions || []).map((c) => ({
            text: c.description,
            date: c.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 15)
          .map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-foreground/10 bg-white p-3 text-sm"
            >
              <p className="text-foreground/70">{item.text}</p>
              <p className="text-xs text-foreground/30 mt-1">
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        {(!completions?.length && !contributions?.length) && (
          <p className="text-sm text-foreground/40">No activity yet.</p>
        )}
      </div>
    </div>
  );
}

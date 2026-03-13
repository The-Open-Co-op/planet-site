import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

export default async function MembersPage() {
  const { data: members, count } = await supabase
    .from("members")
    .select("id, name, avatar_url, interests, joined_at", { count: "exact" })
    .order("joined_at", { ascending: false });

  const totalCount = count || members?.length || 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Members</h1>
      <p className="text-foreground/50 mb-8">
        {totalCount} member{totalCount !== 1 ? "s" : ""} and counting
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(members || []).map((member) => (
          <a
            key={member.id}
            href={`/home/members/${slugify(member.name) || member.id}`}
            className="rounded-xl border border-foreground/10 bg-white p-4 hover:border-foreground/20 transition-colors text-center"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-foreground/5 overflow-hidden flex items-center justify-center">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name || "Member"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-foreground/20">
                  {(member.name || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-display font-bold text-sm truncate">
              {member.name || "Member"}
            </p>
            {member.interests?.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {member.interests.slice(0, 2).map((interest) => (
                  <span
                    key={interest}
                    className="text-[10px] bg-foreground/5 text-foreground/40 rounded-full px-2 py-0.5"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-foreground/30 mt-2">
              Joined{" "}
              {new Date(member.joined_at).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

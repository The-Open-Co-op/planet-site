"use client";

import { useState, useEffect } from "react";

const interestOptions = [
  { label: "Product", value: "product" },
  { label: "Outreach", value: "outreach" },
  { label: "Governance", value: "governance" },
  { label: "Business & Strategy", value: "business" },
  { label: "Just following along", value: "following" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateField(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function toggleInterest(value) {
    const current = profile.interests || [];
    const updated = current.includes(value)
      ? current.filter((i) => i !== value)
      : [...current, value];
    updateField("interests", updated);
  }

  function addLink() {
    if (!newLink.url) return;
    const links = [...(profile.links || []), { ...newLink }];
    updateField("links", links);
    setNewLink({ label: "", url: "" });
  }

  function removeLink(index) {
    const links = (profile.links || []).filter((_, i) => i !== index);
    updateField("links", links);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      updateField("avatar_url", data.url);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl w-full">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl w-full">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>
        <p className="text-foreground/50">Could not load profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full">
      <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="text-center">
          <label className="cursor-pointer inline-block">
            <div className="w-24 h-24 rounded-full mx-auto border-2 border-dashed border-foreground/20 hover:border-foreground/40 overflow-hidden flex items-center justify-center transition-colors">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-foreground/30 text-3xl">+</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-foreground/40 mt-2">Click to change</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={profile.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <p className="text-sm text-foreground/60 bg-foreground/5 rounded-lg px-4 py-3">
            {profile.email}
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Tell other members about yourself..."
            rows={3}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={profile.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium mb-2">Interests</label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleInterest(opt.value)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  (profile.interests || []).includes(opt.value)
                    ? "bg-primary text-white"
                    : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium mb-1">Skills</label>
          <input
            type="text"
            value={(profile.skills || []).join(", ")}
            onChange={(e) =>
              updateField(
                "skills",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="e.g. design, React, writing"
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Time commitment */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Time commitment
          </label>
          <select
            value={profile.time_commitment || ""}
            onChange={(e) => updateField("time_commitment", e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Not set</option>
            <option value="hours_month">A few hours a month</option>
            <option value="hours_week">A few hours a week</option>
            <option value="deeply_involved">Deeply involved</option>
            <option value="keep_informed">Just keep me informed</option>
          </select>
        </div>

        {/* Contact visibility */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`w-12 h-7 rounded-full relative transition-colors duration-200 shrink-0 ${
              profile.show_contact_details ? "bg-primary" : "bg-foreground/20"
            }`}
            onClick={() =>
              updateField(
                "show_contact_details",
                !profile.show_contact_details
              )
            }
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                profile.show_contact_details
                  ? "translate-x-5"
                  : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm">
            Show contact details to other members
          </span>
        </label>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium mb-2">Links</label>
          <div className="space-y-2 mb-3">
            {(profile.links || []).map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-foreground/60 truncate flex-1">
                  {link.label || link.url}
                </span>
                <button
                  onClick={() => removeLink(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              type="text"
              placeholder="Label (e.g. Twitter)"
              value={newLink.label}
              onChange={(e) =>
                setNewLink((l) => ({ ...l, label: e.target.value }))
              }
              className="w-full rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
            />
            <input
              type="url"
              placeholder="URL"
              value={newLink.url}
              onChange={(e) =>
                setNewLink((l) => ({ ...l, url: e.target.value }))
              }
              className="w-full rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
            />
            <button
              onClick={addLink}
              disabled={!newLink.url}
              className="rounded-lg bg-foreground/5 px-3 py-2 text-sm hover:bg-foreground/10 transition-colors disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>

        {/* Membership info */}
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
          <p className="text-sm text-foreground/60">
            Membership: <strong>{profile.oc_tier || "Free"}</strong>
          </p>
          <p className="text-sm text-foreground/60 mt-1">
            Joined:{" "}
            {new Date(profile.joined_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <a
            href="https://opencollective.com/open-coop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            Manage subscription on Open Collective {"\u2197"}
          </a>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}

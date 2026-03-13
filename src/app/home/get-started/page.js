"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const interestOptions = [
  {
    label: "Product",
    description: "Designing and building the apps (design, code, prototyping)",
    value: "product",
  },
  {
    label: "Outreach",
    description:
      "Connecting with communities that could benefit from PLANET and recruiting recognisable names and movement leaders",
    value: "outreach",
  },
  {
    label: "Governance",
    description:
      "Evolving The Open Co-op\u2019s structure as membership grows",
    value: "governance",
  },
  {
    label: "Business & Strategy",
    description: "Funding, partnerships, sustainability",
    value: "business",
  },
  {
    label: "Just following along",
    description: "I want to stay informed for now",
    value: "following",
  },
];

const timeOptions = [
  { label: "A few hours a month", value: "hours_month" },
  { label: "A few hours a week", value: "hours_week" },
  { label: "I want to be deeply involved", value: "deeply_involved" },
  { label: "Just keep me informed", value: "keep_informed" },
];

const skillSuggestions = [
  "development",
  "design",
  "UX",
  "writing",
  "marketing",
  "community organising",
  "project management",
  "legal",
  "finance",
  "translation",
  "testing",
];

const TOTAL_SLIDES = 4;

async function saveToProfile(data) {
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Profile save failed:", err);
    }
  } catch (err) {
    console.error("Profile save error:", err);
  }
}

function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-2 justify-center mb-12">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i <= current
              ? "w-10 bg-primary"
              : "w-6 bg-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}

function SlideWrapper({ children, visible }) {
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
      }`}
    >
      {children}
    </div>
  );
}

export default function GetStartedPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [time, setTime] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [saving, setSaving] = useState(false);

  function toggleInterest(value) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  function addSkill(tag) {
    if (!skills.includes(tag)) {
      setSkills((prev) => [...prev, tag]);
    }
  }

  function removeSkill(tag) {
    setSkills((prev) => prev.filter((s) => s !== tag));
  }

  const goNext = useCallback(
    async (saveData) => {
      if (saveData) {
        saveToProfile(saveData);
      }
      if (slide < TOTAL_SLIDES - 1) {
        setSlide((s) => s + 1);
      }
    },
    [slide]
  );

  const goBack = useCallback(() => {
    if (slide > 0) setSlide((s) => s - 1);
  }, [slide]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Avatar upload failed:", res.status, text);
        return;
      }
      const data = await res.json();
      if (data.url) {
        await saveToProfile({ avatar_url: data.url });
      } else {
        console.error("Avatar upload: no URL returned", data);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    }
    setAvatarUploading(false);
  }

  async function handleFinish() {
    setSaving(true);
    await saveToProfile({
      show_contact_details: showContactDetails,
      onboarding_completed: true,
    });
    setSaving(false);
    router.push("/home");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <ProgressBar current={slide} total={TOTAL_SLIDES} />

        <div className="relative min-h-[400px]">
          {/* Slide 0: Interests */}
          <SlideWrapper visible={slide === 0}>
            <h1 className="font-display text-3xl font-bold mb-2 text-center">
              What interests you most?
            </h1>
            <p className="text-foreground/50 text-center mb-8">
              Choose as many as you like. This helps us show you relevant tasks.
            </p>
            <div className="space-y-3">
              {interestOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleInterest(option.value)}
                  className={`block w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                    interests.includes(option.value)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-foreground/10 bg-white hover:border-foreground/20"
                  }`}
                >
                  <span className="font-display font-bold text-sm">
                    {option.label}
                  </span>
                  <span className="block text-xs text-foreground/50 mt-0.5">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={() =>
                  goNext({ interests })
                }
                disabled={interests.length === 0}
                className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </SlideWrapper>

          {/* Slide 1: Skills */}
          <SlideWrapper visible={slide === 1}>
            <h1 className="font-display text-3xl font-bold mb-2 text-center">
              What skills can you offer?
            </h1>
            <p className="text-foreground/50 text-center mb-8">
              Optional — skip if you&rsquo;re not sure yet.
            </p>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeSkill(tag)}
                      className="hover:text-primary-dark ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type a skill and press enter..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    e.preventDefault();
                    addSkill(skillInput.trim());
                    setSkillInput("");
                  }
                }}
                className="flex-1 rounded-lg border border-foreground/20 bg-white px-4 py-3 text-sm placeholder:text-foreground/40 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {skillSuggestions
                .filter((s) => !skills.includes(s))
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addSkill(tag)}
                    className="rounded-full border border-foreground/15 px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={goBack}
                className="rounded-lg border border-foreground/20 px-6 py-3 text-sm hover:bg-foreground/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() =>
                  goNext({ skills })
                }
                className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors"
              >
                {skills.length > 0 ? "Next" : "Skip"}
              </button>
            </div>
          </SlideWrapper>

          {/* Slide 2: Time */}
          <SlideWrapper visible={slide === 2}>
            <h1 className="font-display text-3xl font-bold mb-2 text-center">
              How much time can you give?
            </h1>
            <p className="text-foreground/50 text-center mb-8">
              No pressure — any amount helps.
            </p>
            <div className="space-y-3">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTime(option.value)}
                  className={`block w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                    time === option.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-foreground/10 bg-white hover:border-foreground/20"
                  }`}
                >
                  <span className="font-display font-bold text-sm">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={goBack}
                className="rounded-lg border border-foreground/20 px-6 py-3 text-sm hover:bg-foreground/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => goNext({ time })}
                disabled={!time}
                className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </SlideWrapper>

          {/* Slide 3: Profile photo & contact preference */}
          <SlideWrapper visible={slide === 3}>
            <h1 className="font-display text-3xl font-bold mb-2 text-center">
              One last thing
            </h1>
            <p className="text-foreground/50 text-center mb-8">
              Both optional — you can always change these later.
            </p>

            <div className="space-y-8">
              {/* Avatar upload */}
              <div className="text-center">
                <p className="font-display font-bold text-sm mb-4">
                  Want to add a profile picture?
                </p>
                <label className="cursor-pointer inline-block">
                  <div
                    className={`w-24 h-24 rounded-full mx-auto border-2 border-dashed transition-colors overflow-hidden flex items-center justify-center ${
                      avatarPreview
                        ? "border-primary"
                        : "border-foreground/20 hover:border-foreground/40"
                    }`}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
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
                {avatarUploading && (
                  <p className="text-xs text-foreground/40 mt-2">
                    Uploading...
                  </p>
                )}
                <p className="text-xs text-foreground/40 mt-2">
                  You can do this later
                </p>
              </div>

              {/* Contact visibility toggle */}
              <label className="flex items-center gap-4 rounded-xl border-2 border-foreground/10 p-4 cursor-pointer hover:border-foreground/20 transition-colors">
                <div
                  className={`w-12 h-7 rounded-full relative transition-colors duration-200 shrink-0 ${
                    showContactDetails ? "bg-primary" : "bg-foreground/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                      showContactDetails
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <span className="font-display font-bold text-sm block">
                    Happy to be contacted by other members?
                  </span>
                  <span className="text-xs text-foreground/50">
                    Your email will be visible on your profile to other members
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={goBack}
                className="rounded-lg border border-foreground/20 px-6 py-3 text-sm hover:bg-foreground/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Let\u2019s go!"}
              </button>
            </div>
          </SlideWrapper>
        </div>
      </div>
    </div>
  );
}

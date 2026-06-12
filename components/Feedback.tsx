"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Smartphone, Monitor, Trash2, Loader2 } from "lucide-react";
import { createFeedback } from "@/app/actions/createFeedback";
import { deleteFeedback } from "@/app/actions/deleteFeedback";
import { useToast } from "@/components/Toast";

// Sections visible to everyone, plus admin-only entries spliced in below.
const OPERATOR_SECTIONS = [
  "Timesheet",
  "Work History",
  "Analytics",
];
const ADMIN_SECTIONS = [
  "My Profile",
  "Administration / Pending Timesheets",
  "Projects",
  "Clients",
  "Employees",
  "Feedback page",
];
const ALWAYS_LAST = ["Other / General"];

export interface FeedbackSubmission {
  id: string;
  section: string;
  platform: "mobile" | "desktop";
  message: string;
  createdAt: string;
  employeeName: string;
}

interface Props {
  isAdmin: boolean;
  submissions: FeedbackSubmission[];
}

function detectPlatform(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function Feedback({ isAdmin, submissions: initialSubmissions }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [section, setSection] = useState("");
  const [platform, setPlatform] = useState<"mobile" | "desktop">("desktop");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Default the platform toggle to whatever the user is currently on, just as a hint —
  // they can flip it if they're filing a bug from desktop about the mobile shell, etc.
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Keep local list in sync if the server re-fetches.
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const sectionOptions = [
    ...OPERATOR_SECTIONS,
    ...(isAdmin ? ADMIN_SECTIONS : []),
    ...ALWAYS_LAST,
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createFeedback(formData);
      if (!result.success) {
        setError('error' in result ? result.error : 'Unknown error');
        return;
      }
      // Reset form, toast, and (for admins) refresh the list.
      setSection("");
      setMessage("");
      showToast("Thanks for the feedback!");
      if (isAdmin) router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteFeedback(id);
      setDeletingId(null);
      if (!result.success) {
        showToast('error' in result ? result.error : 'Unknown error', "error");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      showToast("Feedback deleted");
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">Feedback</h1>
      </div>

      {/* ── Submission form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <p className="text-sm text-gray-500">
          Spot a bug or have a suggestion? Tell us where you saw it and what happened.
        </p>

        {/* Section */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Which section?</label>
          <select
            name="section"
            required
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
          >
            <option value="" disabled>Choose a section…</option>
            {sectionOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Where did you see this?</label>
          <input type="hidden" name="platform" value={platform} />
          <div className="grid grid-cols-2 gap-2">
            {(["mobile", "desktop"] as const).map((p) => {
              const Icon = p === "mobile" ? Smartphone : Monitor;
              const active = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#030213] text-white border-[#030213]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="capitalize">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tell us more</label>
          <textarea
            name="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What happened, or what would you change?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>
      </form>

      {/* ── Admin database ───────────────────────────────────────────── */}
      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              No feedback yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {submissions.map((s) => {
                const PlatformIcon = s.platform === "mobile" ? Smartphone : Monitor;
                const isDeleting = deletingId === s.id;
                return (
                  <li
                    key={s.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {s.section}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          <PlatformIcon className="w-3 h-3" />
                          <span className="capitalize">{s.platform}</span>
                        </span>
                        <span className="text-gray-400">·</span>
                        <span>{s.employeeName}</span>
                        <span className="text-gray-400">·</span>
                        <span>{formatTimestamp(s.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isDeleting}
                        title="Delete feedback"
                        className="text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{s.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

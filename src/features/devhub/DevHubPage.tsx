/**
 * BlackCash — Developer Hub
 *
 * This page intentionally breaks the app's zero-network rule to show community activity.
 * It must never be reachable from within an active financial workspace, and must never touch Dexie/local data.
 *
 * Network calls: READ-ONLY fetch() to api.github.com (public, no auth)
 * - GET /repos/AbhishekVilasiscool/blackcash/discussions?category=ideas
 * - GET /repos/AbhishekVilasiscool/blackcash/issues?labels=suggestion
 *
 * The main financial app (Accountant/CPA/Banker/Investor modes, dashboard, ledger, journal,
 * contacts, settings, DCF, ratios, growth) makes ZERO network calls. All data lives in IndexedDB.
 * This page is a standalone route at /dev, not linked from any ledger UI, and does not import
 * any vault, encryption, or repo modules.
 */

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageSquare, CheckCircle, Clock, XCircle, Link2 } from "lucide-react";
import { Section } from "../../components/ornament/Section";
import { Card } from "../../components/ornament/Card";
import { WaxSeal } from "../../components/ornament/WaxSeal";

const GITHUB_OWNER = "AbhishekVilasiscool";
const GITHUB_REPO = "blackcash";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

interface GitHubDiscussion {
  number: number;
  title: string;
  body: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  category: { name: string; emoji: string };
  labels: Array<{ name: string; color: string; description: string }>;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string; color: string; description: string }>;
  state: "open" | "closed";
}

interface DiscussionItem {
  type: "discussion" | "issue";
  number: number;
  title: string;
  excerpt: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  labels: Array<{ name: string; color: string }>;
  statusLabel?: { name: string; color: string };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getStatusLabel(labels: Array<{ name: string; color: string }>): { name: string; color: string } | undefined {
  const statusNames = ["approved", "in progress", "shipped", "needs discussion", "blocked", "wontfix"];
  return labels.find((l) => statusNames.includes(l.name.toLowerCase()));
}

function getOtherLabels(labels: Array<{ name: string; color: string }>): Array<{ name: string; color: string }> {
  const statusNames = ["approved", "in progress", "shipped", "needs discussion", "blocked", "wontfix"];
  return labels.filter((l) => !statusNames.includes(l.name.toLowerCase()));
}

function renderLabel(name: string, color: string) {
  return (
    <span
      key={name}
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-caps"
      style={{ backgroundColor: `#${color}20`, color: `#${color}`, border: `1px solid #${color}40` }}
    >
      {name}
    </span>
  );
}

export function DevHubPage() {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [issues, setIssues] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommunityData() {
      try {
        const [discussionsRes, issuesRes] = await Promise.all([
          fetch(`${GITHUB_API}/discussions?category=ideas&per_page=50`, {
            headers: { Accept: "application/vnd.github+json" },
          }),
          fetch(`${GITHUB_API}/issues?labels=suggestion&state=all&per_page=50`, {
            headers: { Accept: "application/vnd.github+json" },
          }),
        ]);

        if (cancelled) return;

        if (!discussionsRes.ok || !issuesRes.ok) {
          throw new Error(`GitHub API error: ${discussionsRes.status} / ${issuesRes.status}`);
        }

        const discussionsData: GitHubDiscussion[] = await discussionsRes.json();
        const issuesData: GitHubIssue[] = await issuesRes.json();

        const mappedDiscussions: DiscussionItem[] = discussionsData.map((d) => ({
          type: "discussion",
          number: d.number,
          title: d.title,
          excerpt: d.body?.slice(0, 160) ?? "",
          url: d.html_url,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          labels: d.labels.map((l) => ({ name: l.name, color: l.color })),
          statusLabel: getStatusLabel(d.labels.map((l) => ({ name: l.name, color: l.color }))),
        }));

        const mappedIssues: DiscussionItem[] = issuesData.map((i) => ({
          type: "issue",
          number: i.number,
          title: i.title,
          excerpt: i.body?.slice(0, 160) ?? "",
          url: i.html_url,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
          statusLabel: getStatusLabel(i.labels.map((l) => ({ name: l.name, color: l.color }))),
        }));

        setDiscussions(mappedDiscussions);
        setIssues(mappedIssues);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load community data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommunityData();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    approved: { bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle },
    "in progress": { bg: "bg-blue-500/10", text: "text-blue-400", icon: Clock },
    shipped: { bg: "bg-purple-500/10", text: "text-purple-400", icon: CheckCircle },
    "needs discussion": { bg: "bg-amber-500/10", text: "text-amber-400", icon: MessageSquare },
    blocked: { bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
    wontfix: { bg: "bg-muted/10", text: "text-muted", icon: XCircle },
  };

  function DiscussionCard({ item }: { item: DiscussionItem }) {
    const StatusIcon = item.statusLabel ? statusColors[item.statusLabel.name.toLowerCase()]?.icon : MessageSquare;
    const statusStyle = item.statusLabel ? statusColors[item.statusLabel.name.toLowerCase()] : { bg: "bg-muted/10", text: "text-muted" };

    return (
      <Card className="p-4 hover:bg-white/5 transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            {item.type === "discussion" ? (
              <MessageSquare className="h-4 w-4 text-accent" />
            ) : (
              <Link2 className="h-4 w-4 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-accent text-sm">#{item.number}</span>
              <span className="text-muted text-xs">{formatDate(item.createdAt)}</span>
              {item.statusLabel && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-caps ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {item.statusLabel.name}
                </span>
              )}
            </div>
            <h3 className="font-medium text-text truncate">{item.title}</h3>
            {item.excerpt && <p className="text-sm text-muted mt-1 line-clamp-2">{item.excerpt}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {getOtherLabels(item.labels).map((l) => renderLabel(l.name, l.color))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-caps"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-border bg-[var(--bg-2)]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WaxSeal size={36} tone="accent" aria-hidden="true" />
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight">BlackCash — Developer Hub</h1>
                <p className="text-sm text-muted">Community suggestions, discussions & status tracking</p>
              </div>
            </div>
            <a
              href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/discussions/new?category=ideas`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg font-caps hover:brightness-110 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Suggest a Feature
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Section n={1} title="Community Activity">
          <div className="mb-6 p-4 rounded-xl bg-[var(--bg-2)] border border-border text-sm text-muted">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-accent" />
              <span className="font-caps">Data source:</span>
            </div>
            <p className="text-xs">
              Read-only fetch from <code className="font-mono bg-white/5 px-1 rounded">api.github.com</code> —
              Discussions (category: <strong>Ideas</strong>) + Issues (label: <strong>suggestion</strong>).
              No authentication, no writes. Main app makes zero network calls.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Failed to load: {error}
            </div>
          )}

          {!loading && discussions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-caps text-sm tracking-wider text-muted mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                Discussions (Ideas)
                <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-mono">{discussions.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {discussions.map((d) => (
                  <DiscussionCard key={`discussion-${d.number}`} item={d} />
                ))}
              </div>
            </div>
          )}

          {!loading && issues.length > 0 && (
            <div>
              <h2 className="font-caps text-sm tracking-wider text-muted mb-4 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-accent" />
                Issues (labeled "suggestion")
                <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-mono">{issues.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {issues.map((i) => (
                  <DiscussionCard key={`issue-${i.number}`} item={i} />
                ))}
              </div>
            </div>
          )}

          {!loading && discussions.length === 0 && issues.length === 0 && !error && (
            <div className="text-center py-12 text-muted">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No community suggestions yet. Be the first to <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/discussions/new?category=ideas`} target="_blank" rel="noopener noreferrer" className="text-accent underline">suggest a feature</a>.</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-caps text-sm tracking-wider text-muted mb-4">Status Labels</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "approved", color: "green", icon: CheckCircle },
                { name: "in progress", color: "blue", icon: Clock },
                { name: "shipped", color: "purple", icon: CheckCircle },
                { name: "needs discussion", color: "amber", icon: MessageSquare },
                { name: "blocked", color: "red", icon: XCircle },
                { name: "wontfix", color: "muted", icon: XCircle },
              ].map((s) => (
                <span key={s.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium font-caps bg-${s.color}-500/10 text-${s.color}-400`}>
                  <s.icon className="h-3 w-3" />
                  {s.name}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Labels are managed on GitHub. "suggestion" label marks items shown here.
              Status labels track progress: approved → in progress → shipped.
            </p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border bg-[var(--bg-2)]/80 px-4 py-6">
        <div className="mx-auto max-w-5xl text-center text-xs text-muted">
          BlackCash Developer Hub — Local-first finance toolkit · <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">GitHub Repository</a>
        </div>
      </footer>
    </div>
  );
}

export default DevHubPage;
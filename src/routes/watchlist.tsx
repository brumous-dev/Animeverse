import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { AnimeStatus } from "@/lib/mock-data";
import { fetchAnimeByIds, titleOf } from "@/lib/anilist";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — Aniverse" },
      { name: "description", content: "Your categorized anime watchlist." },
    ],
  }),
  component: Watchlist,
});

const TABS: { key: AnimeStatus; label: string }[] = [
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "plan", label: "Plan to Watch" },
];

function Watchlist() {
  const { user, setProgress, removeFromWatchlist, setStatus } = useAuth();
  const [tab, setTab] = useState<AnimeStatus>("watching");

  const watchlist = user?.watchlist ?? [];
  const ids = useMemo(() => watchlist.map((e) => e.animeId), [watchlist]);
  const { data: medias = [], isLoading } = useQuery({
    queryKey: ["anilist", "watchlist", ids],
    queryFn: () => fetchAnimeByIds(ids),
    staleTime: 5 * 60_000,
    enabled: ids.length > 0,
  });

  const byId = useMemo(() => new Map(medias.map((m) => [m.id, m])), [medias]);
  const entries = watchlist.filter((e) => e.status === tab);

  if (!user) {
    return (
      <div className="glass mt-10 space-y-3 rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">Sign in to start tracking.</p>
        <Link to="/login" className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground neon-glow">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          My <span className="text-gradient">List</span>
        </h1>
        <p className="text-sm text-muted-foreground">Track every series, every episode.</p>
      </div>

      <div className="glass flex rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground neon-glow"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
            ))
          : entries.length === 0
            ? (
              <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </div>
            )
            : entries.map((e) => {
                const a = byId.get(e.animeId);
                if (!a) return null;
                const totalEps = a.episodes ?? Math.max(e.progress, 12);
                const pct = Math.min(100, (e.progress / totalEps) * 100);
                const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : "—";
                return (
                  <div key={e.animeId} className="glass space-y-2 rounded-2xl p-2.5">
                    <div className="flex items-center gap-3">
                      <Link
                        to="/anime/$id"
                        params={{ id: String(a.id) }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <img
                          src={a.coverImage.large}
                          alt={titleOf(a.title)}
                          className="h-16 w-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-semibold">{titleOf(a.title)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {e.progress} / {a.episodes ?? "?"} eps · ★ {score}
                          </p>
                          {e.status !== "plan" && (
                            <div className="h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFromWatchlist(e.animeId)}
                        className="grid h-8 w-8 place-items-center rounded-lg glass text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-xl glass px-1">
                        <button
                          onClick={() => setProgress(e.animeId, Math.max(0, e.progress - 1))}
                          className="grid h-7 w-7 place-items-center"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">
                          {e.progress}
                        </span>
                        <button
                          onClick={() => {
                            const max = a.episodes ?? 9999;
                            setProgress(e.animeId, Math.min(max, e.progress + 1));
                          }}
                          className="grid h-7 w-7 place-items-center"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <select
                        value={e.status}
                        onChange={(ev) => setStatus(e.animeId, ev.target.value as AnimeStatus)}
                        className="flex-1 rounded-xl glass px-2 py-1.5 text-[11px] font-semibold outline-none"
                      >
                        <option value="watching">Watching</option>
                        <option value="completed">Completed</option>
                        <option value="plan">Plan to Watch</option>
                      </select>
                    </div>
                  </div>
                );
              })}
      </div>
    </div>
  );
}

import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, Calendar, Tv, Check, Plus, Minus } from "lucide-react";
import {
  fetchAnimeDetail,
  titleOf,
  stripHtml,
  type AniRelationEdge,
  type AniReview,
} from "@/lib/anilist";
import { useAuth } from "@/lib/auth";
import type { AnimeStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/anime/$id")({
  parseParams: ({ id }) => {
    const n = Number(id);
    if (!Number.isFinite(n)) throw notFound();
    return { id: String(n) };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Anime #${params.id} — Aniverse` },
      { name: "description", content: "Anime details, relations and reviews from AniList." },
    ],
  }),
  component: Details,
});

const RELATION_LABEL: Record<string, string> = {
  PREQUEL: "Prequel",
  SEQUEL: "Sequel",
  SIDE_STORY: "Side Story",
  ALTERNATIVE: "Alternative",
  SPIN_OFF: "Spin-off",
  PARENT: "Parent",
  ADAPTATION: "Adaptation",
  SUMMARY: "Summary",
  CHARACTER: "Character",
  OTHER: "Related",
};

function Details() {
  const { id } = Route.useParams();
  const numericId = Number(id);
  const navigate = useNavigate();
  const { user, getEntry, addToWatchlist, removeFromWatchlist, setProgress, setStatus } = useAuth();
  const entry = getEntry(numericId);

  const { data: anime, isLoading, isError } = useQuery({
    queryKey: ["anilist", "detail", numericId],
    queryFn: () => fetchAnimeDetail(numericId),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="-mx-5 pb-8">
        <div className="h-56 animate-pulse bg-muted/40" />
        <div className="px-5">
          <div className="-mt-24 flex gap-4">
            <div className="h-44 w-32 animate-pulse rounded-2xl bg-muted/40" />
            <div className="flex-1 space-y-2 pt-24">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !anime) {
    return (
      <div className="glass mt-10 rounded-2xl p-8 text-center text-sm text-destructive">
        Couldn't load this title from AniList.
      </div>
    );
  }

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "—";
  const studio = anime.studios.nodes[0]?.name ?? "Unknown studio";
  const author = anime.staff.nodes[0]?.name.full ?? "—";
  const genres = anime.genres ?? [];
  const relations = anime.relations?.edges?.filter((e) => e.node.type === "ANIME") ?? [];
  const reviews = anime.reviews?.nodes ?? [];

  return (
    <div className="-mx-5 space-y-6 pb-8">
      <div className="relative h-56 overflow-hidden">
        {anime.bannerImage ? (
          <img src={anime.bannerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: anime.coverImage.color ?? "#222" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-background/40 to-background" />
        <Link
          to="/"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl glass-strong"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="px-5">
        <div className="-mt-24 flex gap-4">
          <img
            src={anime.coverImage.extraLarge || anime.coverImage.large}
            alt={titleOf(anime.title)}
            className="h-44 w-32 shrink-0 rounded-2xl object-cover shadow-2xl ring-1 ring-border z-1"
          />
          <div className="flex flex-col justify-end pb-1">
            <div className="flex flex-wrap gap-1">
              {genres.slice(0, 3).map((g: string) => (
                <span key={g} className="rounded-full glass px-2 py-0.5 text-[10px] font-semibold">
                  {g}
                </span>
              ))}
            </div>
            <h1 className="mt-2 text-xl font-bold leading-tight">{titleOf(anime.title)}</h1>
            <p className="text-xs text-muted-foreground">
              {studio} · {author}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatPill
            icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
            label="Score"
            value={score}
          />
          <StatPill
            icon={<Tv className="h-4 w-4" />}
            label="Episodes"
            value={anime.episodes ? String(anime.episodes) : "—"}
          />
          <StatPill
            icon={<Calendar className="h-4 w-4" />}
            label="Year"
            value={anime.seasonYear ? String(anime.seasonYear) : "—"}
          />
        </div>

        <div className="mt-4 flex gap-2">
          {!user ? (
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground neon-glow"
            >
              <Plus className="h-4 w-4" /> Sign in to track
            </button>
          ) : !entry ? (
            <button
              onClick={() => addToWatchlist(numericId, "watching")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground neon-glow"
            >
              <Plus className="h-4 w-4" /> Add to Watchlist
            </button>
          ) : (
            <div className="flex flex-1 flex-col gap-2 rounded-xl glass p-2.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Check className="h-3.5 w-3.5" /> In list
                </span>
                <select
                  value={entry.status}
                  onChange={(e) => setStatus(numericId, e.target.value as AnimeStatus)}
                  className="ml-auto rounded-lg glass-strong px-2 py-1 text-[11px] font-semibold outline-none"
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="plan">Plan to Watch</option>
                </select>
                <button
                  onClick={() => removeFromWatchlist(numericId)}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-destructive"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProgress(numericId, Math.max(0, entry.progress - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg glass-strong"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-center text-sm font-bold tabular-nums">
                  {entry.progress} / {anime.episodes ?? "?"} eps
                </span>
                <button
                  onClick={() => {
                    const max = anime.episodes ?? 9999;
                    setProgress(numericId, Math.min(max, entry.progress + 1));
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg glass-strong"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <Section title="Synopsis">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {stripHtml(anime.description) || "No synopsis available."}
          </p>
        </Section>

        {relations.length > 0 && (
          <Section title="Timeline & Relations">
            <div className="relative space-y-3 pl-5">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
              {relations.map((r: AniRelationEdge) => (
                <div key={`${r.relationType}-${r.node.id}`} className="relative">
                  <span className="absolute -left-[18px] top-3 h-3 w-3 rounded-full bg-primary ring-4 ring-background neon-glow" />
                  <Link
                    to="/anime/$id"
                    params={{ id: String(r.node.id) }}
                    className="glass flex items-center gap-3 rounded-2xl p-2.5 transition hover:neon-glow"
                  >
                    <img
                      src={r.node.coverImage.large}
                      alt=""
                      className="h-14 w-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {RELATION_LABEL[r.relationType] ?? r.relationType}
                      </p>
                      <p className="truncate text-sm font-semibold">{titleOf(r.node.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.node.seasonYear ?? "—"} · {r.node.format ?? "ANIME"}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Reviews">
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r: AniReview) => (
                <div key={r.id} className="glass space-y-2 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    {r.user.avatar?.large ? (
                      <img
                        src={r.user.avatar.large}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{r.user.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(r.createdAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      {Math.round(r.score / 10)}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/85">{r.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              No reviews on AniList yet.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-0.5 rounded-2xl px-2 py-3">
      {icon}
      <span className="text-base font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

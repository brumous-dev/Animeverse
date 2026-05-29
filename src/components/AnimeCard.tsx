import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { titleOf, type AniMediaListItem } from "@/lib/anilist";

export function AnimeCard({ anime }: { anime: AniMediaListItem }) {
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "—";
  return (
    <Link
      to="/anime/$id"
      params={{ id: String(anime.id) }}
      className="group relative block overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1 hover:neon-glow"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={anime.coverImage.extraLarge || anime.coverImage.large}
          alt={titleOf(anime.title)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full glass-strong px-2 py-1 text-[11px] font-semibold">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {score}
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow">
            {titleOf(anime.title)}
          </h3>
          <p className="text-[11px] text-white/70">
            {anime.seasonYear ?? "—"} · {anime.episodes ? `${anime.episodes} eps` : "TBA"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div className="aspect-[3/4] w-full animate-pulse bg-muted/40" />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, TrendingUp, Flame } from "lucide-react";
import { fetchAnimeList, ANILIST_GENRES } from "@/lib/anilist";
import { AnimeCard, AnimeCardSkeleton } from "@/components/AnimeCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aniverse — Discover Anime" },
      {
        name: "description",
        content:
          "Track and discover trending anime from AniList with a glassmorphic mobile experience.",
      },
      { property: "og:title", content: "Aniverse" },
      { property: "og:description", content: "Track and discover trending anime." },
    ],
  }),
  component: Index,
});

function useDebounce<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Index() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("All");
  const debounced = useDebounce(q);

  const trending = useQuery({
    queryKey: ["anilist", "trending"],
    queryFn: () => fetchAnimeList({ sort: ["TRENDING_DESC"], perPage: 10 }),
    staleTime: 5 * 60_000,
  });

  const list = useQuery({
    queryKey: ["anilist", "list", debounced, genre],
    queryFn: () =>
      fetchAnimeList({
        search: debounced || undefined,
        genre,
        sort: debounced ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"],
        perPage: 24,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 pt-2">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Discover <span className="text-gradient">Anime</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          What world are you escaping to today?
        </p>
      </section>

      <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {list.isFetching && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      <div className="-mx-5 overflow-x-auto p-5">
        <div className="flex gap-2 pb-1">
          {ANILIST_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                genre === g
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "glass text-foreground/80 hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {!debounced && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold">Trending Now</h2>
          </div>
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="flex gap-3 pb-2">
              {trending.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-[150px] shrink-0">
                      <AnimeCardSkeleton />
                    </div>
                  ))
                : trending.data?.map((a) => (
                    <div key={a.id} className="w-[150px] shrink-0">
                      <AnimeCard anime={a} />
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">
            {debounced
              ? `Results for "${debounced}"`
              : genre === "All"
                ? "Popular Picks"
                : `${genre} for you`}
          </h2>
        </div>

        {list.isError ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-destructive">
            Couldn't reach AniList. Try again in a moment.
          </div>
        ) : list.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        ) : list.data && list.data.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No anime found. Try a different search.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.data?.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

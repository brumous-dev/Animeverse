export type AnimeStatus = "watching" | "completed" | "plan";

export type WatchlistEntry = {
  animeId: number;
  status: AnimeStatus;
  progress: number;
};

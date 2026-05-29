import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Pencil, Trophy, Clock, Star, Tv, Camera, Check, X } from "lucide-react";
import type { AnimeStatus } from "@/lib/mock-data";
import { fetchAnimeByIds, titleOf } from "@/lib/anilist";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Aniverse" },
      { name: "description", content: "Your anime stats and watchlist." },
    ],
  }),
  component: Profile,
});

const TABS: { key: AnimeStatus; label: string }[] = [
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "plan", label: "Plan to Watch" },
];

function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AnimeStatus>("watching");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

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
        <p className="text-sm text-muted-foreground">Sign in to view your profile.</p>
        <Link to="/login" className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground neon-glow">
          Sign in
        </Link>
      </div>
    );
  }

  const completed = watchlist.filter((e) => e.status === "completed");
  const episodes = watchlist.reduce((s, e) => s + e.progress, 0);
  const daysWasted = Math.round((episodes * 22) / 60 / 24);
  const scored = medias.filter((m) => m.averageScore);
  const meanScore = scored.length
    ? (scored.reduce((s, m) => s + (m.averageScore ?? 0), 0) / scored.length / 10).toFixed(1)
    : "—";

  const pickAvatar = () => fileRef.current?.click();
  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const saveName = () => {
    if (name.trim().length >= 2) updateProfile({ name: name.trim() });
    setEditing(false);
  };

  return (
    <div className="space-y-6 pt-2">
      <section className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="absolute inset-0 -z-10 opacity-40">
          <img src={user.banner} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={pickAvatar} className="relative shrink-0" aria-label="Change avatar">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary neon-glow"
            />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
              <Camera className="h-3 w-3" />
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onAvatar}
            />
          </button>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  className="min-w-0 flex-1 rounded-lg bg-background/40 px-2 py-1 text-base font-bold outline-none ring-1 ring-border"
                />
                <button onClick={saveName} className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setName(user.name); setEditing(false); }} className="grid h-7 w-7 place-items-center rounded-lg glass">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground" aria-label="Edit name">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate({ to: "/" }); }}
            className="grid h-10 w-10 place-items-center rounded-xl glass-strong"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard icon={<Tv />} label="Anime Watched" value={completed.length} />
        <StatCard icon={<Clock />} label="Days Wasted" value={daysWasted} accent />
        <StatCard icon={<Star />} label="Mean Score" value={meanScore} />
        <StatCard icon={<Trophy />} label="Episodes" value={episodes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">My List</h2>
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
                    <Link
                      to="/anime/$id"
                      params={{ id: String(a.id) }}
                      key={e.animeId}
                      className="glass flex items-center gap-3 rounded-2xl p-2.5 transition hover:neon-glow"
                    >
                      <img src={a.coverImage.large} alt={titleOf(a.title)} className="h-16 w-12 rounded-lg object-cover" />
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
                  );
                })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${accent ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AnimeStatus, WatchlistEntry } from "@/lib/mock-data";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  banner: string;
  watchlist: WatchlistEntry[];
};

export type PublicUser = Omit<StoredUser, "password">;

type AuthCtx = {
  user: PublicUser | null;
  ready: boolean;
  register: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string };
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<StoredUser, "name" | "avatar" | "banner" | "email">>) => void;
  addToWatchlist: (animeId: number, status?: AnimeStatus) => void;
  removeFromWatchlist: (animeId: number) => void;
  setStatus: (animeId: number, status: AnimeStatus) => void;
  setProgress: (animeId: number, progress: number) => void;
  getEntry: (animeId: number) => WatchlistEntry | undefined;
};

const USERS_KEY = "aniverse.users";
const SESSION_KEY = "aniverse.session";

const Ctx = createContext<AuthCtx | null>(null);

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function readSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function strip(u: StoredUser): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = u;
  return rest;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = readSession();
    if (id) {
      const found = readUsers().find((u) => u.id === id);
      if (found) setUser(strip(found));
    }
    setReady(true);
  }, []);

  const mutateUser = useCallback(
    (fn: (u: StoredUser) => StoredUser) => {
      const users = readUsers();
      const idx = users.findIndex((u) => u.id === user?.id);
      if (idx < 0) return;
      users[idx] = fn(users[idx]);
      writeUsers(users);
      setUser(strip(users[idx]));
    },
    [user?.id],
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      register(name, email, password) {
        const users = readUsers();
        const e = email.trim().toLowerCase();
        if (users.some((u) => u.email.toLowerCase() === e)) {
          return { ok: false, error: "An account with this email already exists." };
        }
        const u: StoredUser = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: e,
          password,
          avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(e)}`,
          banner: `https://picsum.photos/seed/${encodeURIComponent(e)}/1600/700`,
          watchlist: [],
        };
        users.push(u);
        writeUsers(users);
        localStorage.setItem(SESSION_KEY, u.id);
        setUser(strip(u));
        return { ok: true };
      },
      login(email, password) {
        const e = email.trim().toLowerCase();
        const found = readUsers().find(
          (u) => u.email.toLowerCase() === e && u.password === password,
        );
        if (!found) return { ok: false, error: "Invalid email or password." };
        localStorage.setItem(SESSION_KEY, found.id);
        setUser(strip(found));
        return { ok: true };
      },
      logout() {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
      updateProfile(patch) {
        mutateUser((u) => ({ ...u, ...patch }));
      },
      addToWatchlist(animeId, status = "plan") {
        mutateUser((u) => {
          if (u.watchlist.some((e) => e.animeId === animeId)) return u;
          return { ...u, watchlist: [...u.watchlist, { animeId, status, progress: 0 }] };
        });
      },
      removeFromWatchlist(animeId) {
        mutateUser((u) => ({
          ...u,
          watchlist: u.watchlist.filter((e) => e.animeId !== animeId),
        }));
      },
      setStatus(animeId, status) {
        mutateUser((u) => ({
          ...u,
          watchlist: u.watchlist.map((e) =>
            e.animeId === animeId ? { ...e, status } : e,
          ),
        }));
      },
      setProgress(animeId, progress) {
        mutateUser((u) => ({
          ...u,
          watchlist: u.watchlist.map((e) =>
            e.animeId === animeId ? { ...e, progress: Math.max(0, progress) } : e,
          ),
        }));
      },
      getEntry(animeId) {
        return user?.watchlist.find((e) => e.animeId === animeId);
      },
    }),
    [user, ready, mutateUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
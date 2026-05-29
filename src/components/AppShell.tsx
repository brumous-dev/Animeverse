import { Link, useLocation } from "@tanstack/react-router";
import { Compass, Bookmark, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

const tabs = [
  { to: "/", label: "Browse", icon: Compass, match: (p: string) => p === "/" || p.startsWith("/anime") },
  { to: "/watchlist", label: "List", icon: Bookmark, match: (p: string) => p.startsWith("/watchlist") },
  { to: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const onAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[480px] pb-28">
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-5 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl glass neon-glow">
            <span className="text-lg font-black text-gradient">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Ani<span className="text-gradient">verse</span>
          </span>
        </Link>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid h-10 w-10 place-items-center rounded-xl glass transition hover:neon-glow"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      <main className="px-5">{children}</main>

      {!onAuthPage && (
      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2">
        <div className="glass-strong flex items-center justify-around rounded-2xl p-2">
          {tabs.map((t) => {
            if ((t.to === "/watchlist" || t.to === "/profile") && !user) return null;
            const active = t.match(pathname);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                  active ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 -z-0 rounded-xl bg-primary neon-glow" />
                )}
                <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="relative z-10">{t.label}</span>
              </Link>
            );
          })}
          {!user && (
            <Link
              to="/login"
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                pathname === "/login" ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {pathname === "/login" && (
                <span className="absolute inset-0 -z-0 rounded-xl bg-primary neon-glow" />
              )}
              <User className="relative z-10 h-5 w-5" />
              <span className="relative z-10">Sign in</span>
            </Link>
          )}
        </div>
      </nav>
      )}
    </div>
  );
}

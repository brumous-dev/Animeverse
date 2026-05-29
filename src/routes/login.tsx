import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — Aniverse" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ to: "/profile" });
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome <span className="text-gradient">back</span>
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to sync your list.</p>
      </div>

      <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-5">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-background/40 px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-background/40 px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground neon-glow"
        >
          Sign in
        </button>
        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
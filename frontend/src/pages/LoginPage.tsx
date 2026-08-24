import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/context/auth-context";
import { toFriendlyError } from "@/lib/errors";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Already signed in (e.g. navigated to /login manually): bounce to the app.
  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const slug = workspaceSlug.trim().toLowerCase();
    if (!slug || !email.trim() || !password) {
      setFormError("Enter your workspace, email, and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ workspaceSlug: slug, email: email.trim(), password, rememberMe });
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(toFriendlyError(error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel — desktop only. */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-rail-bg p-12 text-rail-text lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <MapPin size={18} className="text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Trackora</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Your delivery operations, in one control tower.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-rail-muted">
            Track shipments, dispatch drivers, and watch performance in real time — with every
            workspace fully isolated from the next.
          </p>
        </div>

        <p className="text-2xs text-rail-muted">
          Multi-tenant delivery management · Secured per workspace
        </p>

        {/* Subtle grid texture. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </aside>

      {/* Form panel. */}
      <main className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <MapPin size={18} className="text-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink">Trackora</span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">Access your workspace dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <TextField
              label="Workspace"
              name="workspaceSlug"
              autoComplete="organization"
              placeholder="acme-logistics"
              value={workspaceSlug}
              onChange={(e) => setWorkspaceSlug(e.target.value)}
              autoFocus
              required
              hint="The workspace slug from your invite."
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                />
                Keep me signed in
              </label>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

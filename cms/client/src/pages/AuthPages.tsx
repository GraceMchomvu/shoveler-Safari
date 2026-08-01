import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Btn, Card, Field, inputClass } from "../components/ui";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [need2fa, setNeed2fa] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, totp || undefined);
      navigate("/app");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign in";
      if (msg === "2FA_REQUIRED") {
        setNeed2fa(true);
        setError("Please enter the 6-digit code from your phone app.");
      } else setError("Email or password is incorrect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in to your website">
      <p className="text-sm text-[var(--muted)] mb-4">
        Enter the email and password you were given to manage Northern Shoveler Adventure.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Your email">
          <input
            className={inputClass}
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className={inputClass}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {need2fa && (
          <Field label="Security code from your phone" hint="Open your authenticator app">
            <input className={inputClass} value={totp} onChange={(e) => setTotp(e.target.value)} />
          </Field>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Btn type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Btn>
      </form>
      <p className="text-sm mt-4 text-center">
        <Link to="/forgot-password" className="underline">
          Forgot your password?
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <AuthShell title="Forgot password">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await api<{ message: string }>("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setMsg(data.message + " (dev: check API console for token)");
        }}
        className="space-y-3"
      >
        <Field label="Email">
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Btn type="submit">Send reset link</Btn>
      </form>
      {msg && <p className="text-sm mt-3 text-green-800">{msg}</p>}
      <p className="text-sm mt-4">
        <Link to="/login" className="underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const token = params.get("token") || "";

  return (
    <AuthShell title="Reset password">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/auth/reset-password", {
              method: "POST",
              body: JSON.stringify({ token, password }),
            });
            navigate("/login");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          }
        }}
        className="space-y-3"
      >
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Btn type="submit">Update password</Btn>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[linear-gradient(160deg,#1a1f1a_0%,#2c3328_45%,#b8953e_140%)]">
      <Card className="w-full max-w-md">
        <div className="mb-4">
          <div className="text-[0.65rem] tracking-[0.2em] uppercase text-[var(--gold)]">
            Northern Shoveler Adventure
          </div>
          <h1 className="text-xl font-semibold mt-1">{title}</h1>
        </div>
        {children}
        <p className="text-xs text-center mt-6 text-[var(--muted)]">
          <a
            href="https://www.shovelersafari.com/"
            className="underline underline-offset-2 hover:text-[var(--gold)]"
          >
            ← Back to website
          </a>
        </p>
      </Card>
    </div>
  );
}

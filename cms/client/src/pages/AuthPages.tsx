import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Btn, Card, Field, inputClass } from "../components/ui";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
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
      await login(loginId, password, totp || undefined);
      navigate("/app"); // Protected route redirects to /change-password when required
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign in";
      if (msg === "2FA_REQUIRED") {
        setNeed2fa(true);
        setError("Please enter the 6-digit code from your phone app.");
      } else if (
        msg.includes("CMS API") ||
        msg.includes("CMS_API_ORIGIN") ||
        msg.includes("Could not reach")
      ) {
        setError(
          "The website admin server is not connected yet. Locally use http://localhost:5173/admin/ with the CMS running. On the live site, CMS_API_ORIGIN must point to your Node API."
        );
      } else setError("Username or password is incorrect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in to your website">
      <p className="text-sm text-[var(--muted)] mb-4">
        Sign in with your <strong>username</strong> (or email) and password.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Username or email" hint="Example: admin">
          <input
            className={inputClass}
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
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
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <AuthShell title="Forgot password">
      <p className="text-sm text-[var(--muted)] mb-4">
        Enter your admin email. We will send a <strong>6-digit verification code</strong> and a
        reset link by <strong>email</strong> and <strong>WhatsApp</strong> (if a phone number is
        saved on your account).
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const data = await api<{ message: string }>("/api/auth/forgot-password", {
              method: "POST",
              body: JSON.stringify({ email }),
            });
            setMsg(data.message);
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Could not start reset");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <Field label="Email">
          <input
            className={inputClass}
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Btn type="submit" disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send code & reset link"}
        </Btn>
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

export function ForceChangePasswordPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell title="Choose a new password">
      <p className="text-sm text-[var(--muted)] mb-4">
        For security, you must set a new password before using the website manager. Use at least 10
        characters with upper case, lower case, and a number.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (newPassword !== confirm) {
            setError("New passwords do not match.");
            return;
          }
          setBusy(true);
          try {
            await api("/api/auth/change-password", {
              method: "POST",
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            await refresh();
            navigate("/app");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update password");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <Field label="Current password">
          <input
            type="password"
            className={inputClass}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            className={inputClass}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Btn type="submit" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save new password"}
        </Btn>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hasToken = token.length >= 20;

  return (
    <AuthShell title="Reset password">
      <p className="text-sm text-[var(--muted)] mb-4">
        {hasToken
          ? "Choose a new password for your account."
          : "Enter the 6-digit code from your email or WhatsApp, then choose a new password."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (password !== confirm) {
            setError("Passwords do not match.");
            return;
          }
          setBusy(true);
          try {
            await api("/api/auth/reset-password", {
              method: "POST",
              body: JSON.stringify(
                hasToken
                  ? { token, password }
                  : { email, code, password }
              ),
            });
            navigate("/login");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        {!hasToken && (
          <>
            <Field label="Email">
              <input
                className={inputClass}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="6-digit verification code" hint="From email or WhatsApp">
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </Field>
          </>
        )}
        <Field
          label="New password"
          hint="At least 10 characters with upper case, lower case, and a number"
        >
          <input
            type="password"
            className={inputClass}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            className={inputClass}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Btn type="submit" disabled={busy} className="w-full">
          {busy ? "Updating…" : "Update password"}
        </Btn>
      </form>
      <p className="text-sm mt-4">
        <Link to="/forgot-password" className="underline">
          Resend code
        </Link>
      </p>
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

import type { HTMLAttributes, ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e8d9b0] bg-[#fff8e8] px-4 py-3 text-sm text-[#5a4a22] mb-4">
      {children}
    </div>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center py-10">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "success";
  disabled?: boolean;
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--gold)] text-[#1a1f1a] hover:brightness-95"
      : variant === "success"
        ? "bg-emerald-700 text-white hover:bg-emerald-800"
        : variant === "danger"
          ? "bg-red-700 text-white"
          : "border border-[var(--border)] bg-white hover:bg-[var(--cream)]";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm mb-3">
      <span className="block mb-1 font-medium text-[var(--ink)]">{label}</span>
      {hint && <span className="block mb-1.5 text-xs text-[var(--muted)]">{hint}</span>}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-emerald-100 text-emerald-800",
    DRAFT: "bg-amber-100 text-amber-900",
    SCHEDULED: "bg-sky-100 text-sky-900",
    PENDING: "bg-amber-100 text-amber-900",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
    SPAM: "bg-stone-200 text-stone-700",
  };
  const label: Record<string, string> = {
    PUBLISHED: "Live on website",
    DRAFT: "Draft (not public)",
    SCHEDULED: "Scheduled",
    PENDING: "Waiting for approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SPAM: "Spam",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-stone-100"}`}>
      {label[status] || status}
    </span>
  );
}

export function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: ReactNode;
}) {
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-white">
      <table className="w-full text-sm">
        <thead className="bg-[var(--cream)] text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold text-[var(--muted)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--cream)]/40">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConfirmButton({
  label,
  confirmText,
  onConfirm,
  variant = "danger",
}: {
  label: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  variant?: "danger" | "ghost";
}) {
  return (
    <Btn
      variant={variant}
      onClick={async () => {
        if (window.confirm(confirmText)) await onConfirm();
      }}
    >
      {label}
    </Btn>
  );
}

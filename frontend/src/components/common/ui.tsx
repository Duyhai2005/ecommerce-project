"use client";

import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, Search, XCircle } from "lucide-react";
import { statusTone } from "@/lib/helpers";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export { cn };

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "amber";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-panel border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-primary bg-primary text-white hover:bg-[#085a42]",
        variant === "secondary" && "border-line bg-white text-ink hover:border-primary/40 hover:text-primary",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:bg-white hover:text-ink",
        variant === "danger" && "border-coral bg-coral text-white hover:bg-[#cf453c]",
        variant === "amber" && "border-amber bg-amber text-ink hover:bg-[#e4961d]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-panel border border-line bg-white text-ink transition hover:border-primary/50 hover:text-primary disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70 transition focus:border-primary",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-panel border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition focus:border-primary",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink transition focus:border-primary",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label?: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-ink", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-line accent-primary"
        {...props}
      />
      {label}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label?: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-ink", className)}>
      <input
        type="radio"
        className="h-4 w-4 border-line accent-primary"
        {...props}
      />
      {label}
    </label>
  );
}

export function Label({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-ink", className)}>{children}</label>;
}

export function Field({
  label,
  children,
  hint
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-[6px] border px-2 py-0.5 text-xs font-semibold",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber/30 bg-amber/15 text-[#8a5a00]",
        tone === "danger" && "border-coral/30 bg-coral/10 text-coral",
        tone === "neutral" && "border-line bg-white text-muted",
        tone === "info" && "border-sky/30 bg-sky/10 text-sky",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={statusTone(status)}>{label ?? status}</Badge>;
}

export function Section({
  title,
  description,
  action,
  children,
  className
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-5", className)}>
      {(title || description || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h2 className="text-xl font-bold tracking-normal text-ink sm:text-2xl">{title}</h2> : null}
            {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-panel border border-line bg-white p-4 shadow-soft", className)}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-dashed border-line bg-white p-8 text-center">
      <Info className="mx-auto h-9 w-9 text-sky" aria-hidden="true" />
      <h3 className="mt-3 text-base font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-coral/30 bg-coral/10 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-coral" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-panel bg-line/70", className)} />;
}

export function Toast({
  message,
  tone
}: {
  message?: string;
  tone?: "success" | "danger" | "info";
}) {
  if (!message) return null;
  const Icon = tone === "danger" ? XCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-panel border border-line bg-white p-3 text-sm shadow-soft">
      <Icon
        className={cn(
          "h-5 w-5",
          tone === "danger" && "text-coral",
          tone === "success" && "text-primary",
          tone === "info" && "text-sky"
        )}
        aria-hidden="true"
      />
      <span className="text-ink">{message}</span>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Tìm sản phẩm, shop, danh mục",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function LoadingInline({ label = "Đang tải" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
  empty
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: ReactNode;
}) {
  if (!rows.length) {
    return <>{empty ?? <EmptyState title="Chưa có dữ liệu" description="Không tìm thấy bản ghi phù hợp." />}</>;
  }
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-canvas text-xs uppercase text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap border-b border-line px-3 py-3 font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-3 py-3 align-middle text-ink">
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

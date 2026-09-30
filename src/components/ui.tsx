import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// These primitives use no hooks, so they can be rendered from both server and
// client components.

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-sm",
  secondary:
    "border border-ink-200 bg-white/80 backdrop-blur-sm text-ink-900 hover:bg-white active:bg-ink-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
  ghost: "text-ink-700 hover:bg-ink-100/80 hover:text-ink-900 active:bg-ink-200/60",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  gold: "bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-sm",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs font-medium gap-1.5",
  md: "h-10 px-4 text-sm font-medium gap-2",
  lg: "h-12 px-6 text-sm font-semibold gap-2.5",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 select-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonStyles(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200/70 bg-white/80 backdrop-blur-md shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700 border-ink-200/60",
    success: "bg-brand-50 text-brand-800 border-brand-200/60",
    warning: "bg-gold-50 text-gold-800 border-gold-200/60",
    danger: "bg-red-50 text-red-700 border-red-200/60",
    info: "bg-blue-50 text-blue-800 border-blue-200/60",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-sm text-ink-500">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field-input", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("field-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field-input", className)} {...props} />;
}

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-brand-200 bg-brand-50 text-brand-900",
    warning: "border-gold-200 bg-gold-50 text-gold-900",
    danger: "border-red-200 bg-red-50 text-red-800",
  } as const;

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-ink-400">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {body ? <p className="mt-1.5 max-w-md text-ink-600">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
        {title}
      </h2>
      {action}
    </div>
  );
}

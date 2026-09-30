"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { Alert, Field, Input, buttonStyles } from "@/components/ui";
import { link, type Locale } from "@/lib/i18n";

function Submit({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buttonStyles("primary", "lg", "w-full")}
    >
      {pending ? <Loader2 size={18} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

function PasswordInput({
  id,
  name,
  defaultValue,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  showLabel,
  hideLabel,
  locale = "en",
  show: controlledShow,
  onToggleShow,
  showCheckbox = true,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  showLabel?: string;
  hideLabel?: string;
  locale?: Locale;
  show?: boolean;
  onToggleShow?: (nextState: boolean) => void;
  showCheckbox?: boolean;
}) {
  const [internalVal, setInternalVal] = useState(defaultValue ?? "");
  const isControlledVal = value !== undefined;
  const currentVal = isControlledVal ? value : internalVal;

  const [internalShow, setInternalShow] = useState(false);
  const isControlledShow = typeof controlledShow === "boolean";
  const show = isControlledShow ? controlledShow : internalShow;

  const toggle = (nextState?: boolean) => {
    const target = typeof nextState === "boolean" ? nextState : !show;
    if (isControlledShow && onToggleShow) {
      onToggleShow(target);
    } else {
      setInternalShow(target);
    }
  };

  const resolvedShowLabel = showLabel || (locale === "sw" ? "Onyesha nenosiri" : "Show password");
  const resolvedHideLabel = hideLabel || (locale === "sw" ? "Ficha nenosiri" : "Hide password");
  const toggleText = show ? (locale === "sw" ? "Ficha" : "Hide") : (locale === "sw" ? "Onyesha" : "Show");

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={id}
          name={name}
          value={currentVal}
          onChange={(e) => {
            if (!isControlledVal) setInternalVal(e.target.value);
            onChange?.(e);
          }}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="field-input pr-24"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          aria-label={show ? resolvedHideLabel : resolvedShowLabel}
          title={show ? resolvedHideLabel : resolvedShowLabel}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 inline-flex items-center gap-1.5 rounded-md bg-ink-100 hover:bg-ink-200 border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 hover:text-ink-950 transition-colors shadow-xs cursor-pointer select-none"
        >
          {show ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          <span className="text-[11px] font-bold">{toggleText}</span>
        </button>
      </div>

      {showCheckbox && (
        <div className="flex items-center justify-between pt-0.5">
          <label
            htmlFor={`${id}-show-toggle`}
            className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-ink-600 hover:text-ink-900 transition-colors"
          >
            <input
              id={`${id}-show-toggle`}
              type="checkbox"
              checked={show}
              onChange={(e) => toggle(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <span className="font-medium">{show ? resolvedHideLabel : resolvedShowLabel}</span>
          </label>
        </div>
      )}
    </div>
  );
}

export function LoginForm({
  locale,
  next,
  labels,
  demoType,
}: {
  locale: Locale;
  next?: string;
  labels: {
    phone: string;
    password: string;
    submit: string;
    showPassword?: string;
    hidePassword?: string;
  };
  demoType?: "admin" | "customer";
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(loginAction, null);
  const [phoneVal, setPhoneVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");

  const handleFillDemo = (phone: string, pass: string) => {
    setPhoneVal(phone);
    setPasswordVal(pass);
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      {/* Demo Credentials Quick Fill */}
      {demoType === "admin" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Demo Administrator Account:</span>
            <button
              type="button"
              onClick={() => handleFillDemo("0700 000 001", "password123")}
              className="rounded bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Fill Admin
            </button>
          </div>
          <p className="mt-1 text-[11px] text-amber-800 font-mono">
            Phone: 0700 000 001 · Pass: password123
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50/80 p-3 text-xs text-brand-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Quick Demo Login:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo("0712 000 001", "password123")}
                className="rounded bg-brand-200/80 px-2 py-0.5 text-[11px] font-bold text-brand-950 hover:bg-brand-300 transition-colors cursor-pointer"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("0719 000 009", "password123")}
                className="rounded bg-brand-200/80 px-2 py-0.5 text-[11px] font-bold text-brand-950 hover:bg-brand-300 transition-colors cursor-pointer"
              >
                Student Seller
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-brand-800 font-mono">
            Pass: password123 (or Admin@2026)
          </p>
        </div>
      )}

      <Field label={labels.phone} htmlFor="phone" required>
        <Input
          id="phone"
          name="phone"
          value={phoneVal}
          onChange={(e) => setPhoneVal(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          required
        />
      </Field>

      <Field label={labels.password} htmlFor="password" required>
        <PasswordInput
          id="password"
          name="password"
          value={passwordVal}
          onChange={(e) => setPasswordVal(e.target.value)}
          autoComplete="current-password"
          required
          locale={locale}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
      </Field>

      <Submit label={labels.submit} />
    </form>
  );
}

export function RegisterForm({
  locale,
  next,
  labels,
}: {
  locale: Locale;
  next?: string;
  labels: {
    name: string;
    phone: string;
    phoneHint: string;
    email: string;
    optional: string;
    password: string;
    confirmPassword: string;
    submit: string;
    showPassword?: string;
    hidePassword?: string;
  };
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    registerAction,
    null,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const trimmedPass = password.trim();
  const trimmedConfirm = confirmPassword.trim();
  const hasConfirm = confirmPassword.length > 0;
  const passwordsMatch = trimmedPass.length >= 8 && trimmedPass === trimmedConfirm;
  const passwordsMismatch = hasConfirm && trimmedPass !== trimmedConfirm;

  const handleToggleAll = (checked: boolean) => {
    setShowPassword(checked);
    setShowConfirm(checked);
  };

  const allShown = showPassword && showConfirm;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.error ? (
        <Alert tone="danger">
          <div className="space-y-1.5">
            <p>{state.error}</p>
            {(state.error.toLowerCase().includes("already") ||
              state.error.toLowerCase().includes("tayari") ||
              state.error.toLowerCase().includes("inatumika") ||
              state.error.toLowerCase().includes("belongs")) && (
              <p className="text-xs pt-1 border-t border-red-200">
                {locale === "sw" ? "Je, tayari una akaunti? " : "Already registered with this number? "}
                <Link
                  href={
                    next
                      ? `${link(locale, "/login")}?next=${encodeURIComponent(next)}`
                      : link(locale, "/login")
                  }
                  className="font-bold underline text-brand-900 hover:text-brand-700"
                >
                  {locale === "sw" ? "Bofya hapa kuingia moja kwa moja" : "Click here to sign in"}
                </Link>
              </p>
            )}
          </div>
        </Alert>
      ) : null}

      <Field label={labels.name} htmlFor="name" required>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>

      <Field label={labels.phone} htmlFor="phone" hint={labels.phoneHint} required>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          required
        />
      </Field>

      <Field label={`${labels.email} (${labels.optional})`} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field label={labels.password} htmlFor="password" required>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          locale={locale}
          show={showPassword}
          onToggleShow={(s) => setShowPassword(s)}
          showCheckbox={true}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        {password.length > 0 && password.length < 8 && (
          <p className="mt-1 text-xs text-amber-600">
            {locale === "sw"
              ? `Nenosiri liwe na angalau herufi 8 (sasa ni herufi ${password.length})`
              : `Password must be at least 8 characters (currently ${password.length})`}
          </p>
        )}
      </Field>

      <Field label={labels.confirmPassword} htmlFor="confirmPassword" required>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          locale={locale}
          show={showConfirm}
          onToggleShow={(s) => setShowConfirm(s)}
          showCheckbox={true}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        {hasConfirm && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {passwordsMatch ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 size={14} className="text-emerald-600" />
                {locale === "sw" ? "Manenosiri yanafanana kikamilifu" : "Passwords match"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-red-600">
                <AlertCircle size={14} className="text-red-500" />
                {locale === "sw" ? "Manenosiri hayafanani bado" : "Passwords do not match yet"}
              </span>
            )}
          </div>
        )}
      </Field>

      {/* Synchronized Show/Hide All Passwords Checkbox */}
      <div className="pt-0.5 pb-1">
        <label
          htmlFor="register-show-passwords-all"
          className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-ink-800 hover:text-ink-950 transition-colors"
        >
          <input
            id="register-show-passwords-all"
            type="checkbox"
            checked={allShown}
            onChange={(e) => handleToggleAll(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <span>
            {allShown
              ? (locale === "sw" ? "Ficha manenosiri yote" : "Hide all passwords")
              : (locale === "sw" ? "Onyesha manenosiri yote" : "Show all passwords")}
          </span>
        </label>
      </div>

      <Submit label={labels.submit} disabled={passwordsMismatch} />
    </form>
  );
}

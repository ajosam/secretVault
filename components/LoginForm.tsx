"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {justCreated && (
        <div className="rounded-md border border-success/25 bg-success/10 px-3 py-2 text-[12px] text-success">
          Account created. Sign in to continue.
        </div>
      )}
      {formError && (
        <div className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {formError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[12px] font-medium text-fg-muted">
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register("email")}
          className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {errors.email && <p className="text-[11.5px] text-danger">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-[12px] font-medium text-fg-muted">
            Password
          </label>
          <Link href="#" className="text-[11.5px] text-fg-subtle hover:text-accent">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="h-9 w-full rounded-md border border-border bg-surface-2 px-2.5 pr-9 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg-muted"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        {errors.password && <p className="text-[11.5px] text-danger">{errors.password.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-[12.5px] text-fg-muted">
        <input type="checkbox" {...register("rememberMe")} className="h-3.5 w-3.5 accent-blue-500" />
        Remember me on this device
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex h-9 items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-medium text-accent-fg transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}

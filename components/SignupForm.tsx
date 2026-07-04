"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signupSchema, type SignupValues } from "@/lib/auth-schemas";

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      organizationName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: values.fullName,
        organizationName: values.organizationName,
        email: values.email,
        password: values.password,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      if (error?.code === "CONFLICT" && error.message.includes("email")) {
        setError("email", { message: error.message });
      } else if (error?.code === "CONFLICT") {
        setError("organizationName", { message: error.message });
      } else {
        setFormError(error?.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    router.push("/login?created=true");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && (
        <div className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-[12px] font-medium text-fg-muted">
            Full name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            placeholder="Ajo Sam"
            {...register("fullName")}
            className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          {errors.fullName && <p className="text-[11.5px] text-danger">{errors.fullName.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="organizationName" className="text-[12px] font-medium text-fg-muted">
            Organization
          </label>
          <input
            id="organizationName"
            autoComplete="organization"
            placeholder="propcrm"
            {...register("organizationName")}
            className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          {errors.organizationName && (
            <p className="text-[11.5px] text-danger">{errors.organizationName.message}</p>
          )}
        </div>
      </div>

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
        <label htmlFor="password" className="text-[12px] font-medium text-fg-muted">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        {errors.password ? (
          <p className="text-[11.5px] text-danger">{errors.password.message}</p>
        ) : (
          <p className="text-[11px] text-fg-subtle">At least 8 characters, one uppercase letter, one number.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-[12px] font-medium text-fg-muted">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirmPassword")}
          className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {errors.confirmPassword && (
          <p className="text-[11.5px] text-danger">{errors.confirmPassword.message}</p>
        )}
      </div>

      <label className="flex items-start gap-2 text-[12px] text-fg-muted">
        <input
          type="checkbox"
          {...register("acceptTerms")}
          className="mt-0.5 h-3.5 w-3.5 accent-blue-500"
        />
        <span>
          I agree to the <span className="text-fg">Terms of Service</span> and{" "}
          <span className="text-fg">Privacy Policy</span>.
        </span>
      </label>
      {errors.acceptTerms && <p className="-mt-2 text-[11.5px] text-danger">{errors.acceptTerms.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex h-9 items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-medium text-accent-fg transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Create account
      </button>
    </form>
  );
}

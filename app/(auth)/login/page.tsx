import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in to Vaultline"
      subtitle="Enterprise secret management"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

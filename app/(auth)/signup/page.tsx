import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your Vaultline account"
      subtitle="Set up your organization in a minute"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}

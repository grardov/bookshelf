import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = createMetadata({
  title: "Log in",
  description: "Log in to your Bookshelf account",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

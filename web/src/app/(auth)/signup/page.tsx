import { createMetadata } from "@/lib/metadata";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = createMetadata({
  title: "Sign up",
  description: "Create your Bookshelf account",
  path: "/signup",
});

export default function SignupPage() {
  return <SignupForm />;
}

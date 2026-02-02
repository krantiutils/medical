"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useParams<{ lang: string }>();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setFormError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  const getErrorMessage = (errorCode: string | null): string | null => {
    if (!errorCode) return null;
    switch (errorCode) {
      case "CredentialsSignin":
        return "Invalid email or password";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account";
      case "EmailSignin":
        return "Error sending verification email";
      default:
        return "An error occurred during sign in";
    }
  };

  const displayError = formError || getErrorMessage(error);

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
              Welcome Back
            </span>
            <h1 className="text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
              Sign In
            </h1>
            <p className="text-foreground/70">
              Access your healthcare professional account
            </p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
              <p className="font-medium">{displayError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-4"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background px-4 text-foreground/60 font-bold">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full py-4 flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Register Link */}
          <p className="mt-8 text-center text-foreground/70">
            Don&apos;t have an account?{" "}
            <Link
              href={`/${lang}/register`}
              className="font-bold text-primary-blue hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[40%] bg-primary-blue relative">
        {/* Geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle */}
          <div className="absolute top-1/4 -right-20 w-64 h-64 rounded-full border-8 border-white/20" />

          {/* Small filled circle */}
          <div className="absolute bottom-1/3 left-1/4 w-12 h-12 rounded-full bg-primary-yellow" />

          {/* Square */}
          <div className="absolute top-1/2 left-12 w-20 h-20 bg-primary-red rotate-12" />

          {/* Triangle */}
          <div
            className="absolute bottom-20 right-20 w-24 h-24 bg-white/20"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />

          {/* Additional elements */}
          <div className="absolute top-16 left-16 w-6 h-6 bg-white" />
          <div className="absolute top-20 left-24 w-3 h-3 bg-primary-yellow" />

          {/* Large outlined square */}
          <div className="absolute bottom-1/4 right-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="text-white text-center">
            <div className="text-5xl font-black mb-4">स्वास्थ्य</div>
            <div className="text-lg font-medium uppercase tracking-widest opacity-80">
              Swasthya
            </div>
            <p className="mt-6 text-white/70 max-w-xs">
              Join Nepal&apos;s largest healthcare professional directory
            </p>
          </div>
        </div>
      </div>

      {/* Mobile geometric accent bar */}
      <div className="lg:hidden h-4 flex">
        <div className="flex-1 bg-primary-blue" />
        <div className="flex-1 bg-primary-red" />
        <div className="flex-1 bg-primary-yellow" />
      </div>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4" />
        <div className="h-4 bg-foreground/10 rounded w-32 mx-auto" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

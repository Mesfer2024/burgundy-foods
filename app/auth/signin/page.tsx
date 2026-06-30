"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import TopNav from "@/components/TopNav";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

export default function SignInPage() {
  const router = useRouter();
  const { text } = useLocaleTheme();
  const auth = text.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      setMessage(auth.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-14 lg:px-0">
        <section className="data-card p-8 sm:p-10">
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold text-foreground">
            <LogIn className="h-6 w-6 text-primary" aria-hidden="true" />
            {auth.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {auth.lead}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-foreground">
              {auth.email}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              {auth.password}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              />
            </label>
            {message ? <p className="text-sm text-red-600">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {loading ? auth.loading : auth.submit}
            </button>
          </form>
          <p className="mt-6 text-sm text-muted">
            {auth.help}
          </p>
        </section>
      </main>
    </div>
  );
}

"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { LocaleThemeProvider } from "@/components/LocaleThemeProvider";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session;
}) {
  return (
    <SessionProvider session={session}>
      <LocaleThemeProvider>{children}</LocaleThemeProvider>
    </SessionProvider>
  );
}

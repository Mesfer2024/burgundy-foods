import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session;
}

export function canAccess(session: Awaited<ReturnType<typeof getCurrentSession>>, roles: string[]) {
  return !!session?.user && roles.includes(session.user.role);
}

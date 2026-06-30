"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { text, isArabic } = useLocaleTheme();
  const pathname = usePathname();
  const dashboard = text.dashboard;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const navItems = [
    { href: "/dashboard", label: dashboard.links[0], Icon: Home },
    { href: "/dashboard/products", label: dashboard.links[1], Icon: PackageSearch },
    { href: "/dashboard/customers", label: dashboard.links[2], Icon: Users },
    { href: "/dashboard/suppliers", label: dashboard.links[3], Icon: Truck },
    { href: "/dashboard/purchases", label: dashboard.links[4], Icon: ShoppingCart },
    { href: "/dashboard/inventory", label: dashboard.links[5], Icon: Boxes },
    { href: "/dashboard/quotations", label: dashboard.links[6], Icon: ClipboardList },
    { href: "/dashboard/sales-orders", label: dashboard.links[7], Icon: ShoppingCart },
    { href: "/dashboard/delivery-notes", label: dashboard.links[8], Icon: Truck },
    { href: "/dashboard/invoices", label: dashboard.links[9], Icon: FileText },
    { href: "/dashboard/payments", label: dashboard.links[10], Icon: CreditCard },
    { href: "/dashboard/finance", label: dashboard.links[11], Icon: ReceiptText },
    { href: "/dashboard/reports", label: dashboard.links[12], Icon: BarChart3 },
    { href: "/dashboard/settings", label: dashboard.links[13], Icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="data-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              {dashboard.kicker}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{dashboard.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {dashboard.lead}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-background">
              <BackIcon className="h-4 w-4" aria-hidden="true" />
              {dashboard.back}
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {dashboard.signOut}
            </button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="data-card p-3 lg:sticky lg:top-24 lg:self-start">
            <nav className="grid gap-1 text-sm font-medium text-muted" aria-label="Dashboard">
              {navItems.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 transition hover:bg-primary/10 hover:text-primary ${
                    pathname === href ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

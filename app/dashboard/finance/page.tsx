import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardFinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [transactions, revenue, expenses] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 8 }),
    prisma.transaction.aggregate({ where: { type: "REVENUE" }, _sum: { amount: true } }).then((res) => res._sum.amount ?? 0),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }).then((res) => res._sum.amount ?? 0),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">قسم المحاسبة المبسط</h1>
        <p className="mt-2 text-sm text-muted">راقب الإيرادات والمصروفات وحساب الربح والخسارة بصورة أولية.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="metric-card p-6">
          <p className="text-sm text-muted">إيرادات</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{revenue.toFixed(2)} ر.س</p>
        </div>
        <div className="metric-card p-6">
          <p className="text-sm text-muted">مصاريف</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{expenses.toFixed(2)} ر.س</p>
        </div>
        <div className="metric-card p-6">
          <p className="text-sm text-muted">ربح/خسارة مبدئي</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{(revenue - expenses).toFixed(2)} ر.س</p>
        </div>
      </div>
      <div className="data-card p-6">
        <h2 className="text-xl font-semibold text-foreground">آخر المعاملات</h2>
        <div className="mt-4 space-y-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted">لا توجد معاملات حتى الآن.</p>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-foreground">{transaction.category || transaction.type}</p>
                  <p className="text-sm text-muted">{new Date(transaction.date).toLocaleDateString("ar-SA")}</p>
                </div>
                <p className="mt-2 text-sm text-muted">{transaction.description}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{transaction.amount.toFixed(2)} ر.س</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

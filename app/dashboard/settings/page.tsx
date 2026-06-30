import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import AccountEmailForm from "@/components/AccountEmailForm";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-foreground">إعدادات الشركة</h1>
        <p className="text-sm leading-6 text-muted">
          عدل بيانات الشركة القابلة للتعديل لاحقاً من هنا، مثل العنوان والجوال والبريد والشعار.
        </p>
      </div>
      <SettingsForm />

      <div className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold text-foreground">حسابي</h2>
        <p className="text-sm leading-6 text-muted">
          إعدادات حساب المدير الحالي. هذه البيانات شخصية ولا تظهر على الموقع العام.
        </p>
      </div>
      <AccountEmailForm currentEmail={user?.email ?? session.user.email ?? ""} />
    </section>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SettingsForm from "@/components/SettingsForm";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <section>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-foreground">إعدادات الشركة</h1>
        <p className="text-sm leading-6 text-muted">
          عدل بيانات الشركة القابلة للتعديل لاحقاً من هنا، مثل العنوان والجوال والبريد والشعار.
        </p>
      </div>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </section>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ComingSoon from "@/components/ComingSoon";

export default async function DashboardReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <ComingSoon
      title="التقارير المالية والتشغيلية"
      description="تقارير قابلة للتصدير لخدمة المحاسب الخارجي وأغراض الزكاة والضريبة. الهدف تجهيز بيانات تشغيلية دقيقة، وليس استبدال نظام محاسبي معتمد."
      bullets={[
        "تقرير المبيعات (شهري / ربع سنوي / سنوي)",
        "تقرير المشتريات والتكاليف الكاملة",
        "تقييم المخزون وتحركاته",
        "أرصدة العملاء وأرصدة الموردين",
        "تقرير هامش الربح وتقدير الربح",
        "تقرير ضريبة القيمة المضافة (مدخلات / مخرجات / صافي)",
        "تصدير Excel / CSV لكل تقرير",
      ]}
    />
  );
}

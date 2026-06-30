import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ComingSoon from "@/components/ComingSoon";

export default async function DashboardPurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <ComingSoon
      title="المشتريات والاستيراد"
      description="تسجيل فواتير الشراء من المصنعين والموردين، احتساب التكلفة الكاملة للكرتون والوحدة (شراء + شحن + جمارك + تخزين + رسوم أخرى)، وربط كل دفعة بالمخزون والموردين والمستندات الرسمية."
      bullets={[
        "رقم فاتورة المورد + التاريخ + العملة وسعر الصرف",
        "خطوط المنتجات بالكميات (حاوية / طبلية / كرتون / وحدة)",
        "تكلفة الشراء + الشحن + التخليص + التخزين + رسوم أخرى",
        "احتساب التكلفة الكاملة لكل كرتون ولكل وحدة",
        "ضريبة القيمة المضافة على المدخلات (إن وُجدت)",
        "إرفاق فاتورة المورد / قائمة التعبئة / بوليصة الشحن / مستندات الجمارك",
      ]}
    />
  );
}

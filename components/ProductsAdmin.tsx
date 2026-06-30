"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Plus, Save, ShieldAlert, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  sku?: string | null;
  internalSku?: string | null;
  supplierSku?: string | null;
  barcode?: string | null;
  nameAr: string;
  nameEn: string;
  type: string;
  weight?: string | null;
  unitWeightGrams?: number | null;
  packSize?: string | null;
  packsPerCarton?: number | null;
  unitsPerCarton?: number | null;
  cartonsPerPallet?: number | null;
  palletsPerContainer?: number | null;
  cartonsPerContainer?: number | null;
  minimumOrderQuantity?: number | null;
  originCountry?: string | null;
  imageUrl?: string | null;
  cartonPurchase: number;
  cartonSale: number;
  shippingCost: number;
  customsCost: number;
  totalCost: number;
  marginPercent: number;
  active: boolean;
  isVerified: boolean;
  supplierId?: string | null;
};

type SupplierOption = { id: string; nameAr: string };

const initialForm = {
  id: "",
  sku: "",
  internalSku: "",
  supplierSku: "",
  barcode: "",
  nameAr: "",
  nameEn: "",
  type: "Spaghetti",
  weight: "",
  unitWeightGrams: "",
  packSize: "",
  packsPerCarton: "",
  unitsPerCarton: "",
  cartonsPerPallet: "",
  palletsPerContainer: "",
  cartonsPerContainer: "",
  minimumOrderQuantity: "",
  originCountry: "",
  imageUrl: "",
  cartonPurchase: 0,
  cartonSale: 0,
  shippingCost: 0,
  customsCost: 0,
  active: true,
  isVerified: false,
  supplierId: "",
};

const UNVERIFIED_LABEL = "غير محدد";

function showOrUnverified(value: unknown) {
  if (value === null || value === undefined || value === "") return UNVERIFIED_LABEL;
  return String(value);
}

export default function ProductsAdmin({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/suppliers", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, []);

  function resetForm(clearStatus = true) {
    setForm(initialForm);
    setEditingId(null);
    if (clearStatus) setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      const product = await response.json();
      if (editingId) {
        setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
        setStatus("تم تحديث المنتج بنجاح.");
      } else {
        setProducts((current) => [product, ...current]);
        setStatus("تم إضافة المنتج بنجاح.");
      }
      resetForm(false);
    } else {
      setStatus("حدث خطأ أثناء حفظ المنتج.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟ إذا كان مرتبطاً بطلبات أو مخزون سيتم تعطيله فقط.")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (response.ok) {
      const result = await response.json();
      if (result.archived && result.product) {
        setProducts((current) => current.map((product) => (product.id === id ? result.product : product)));
        setStatus("المنتج مرتبط ببيانات تشغيلية، لذلك تم تعطيله بدلاً من حذفه.");
      } else {
        setProducts((current) => current.filter((product) => product.id !== id));
        setStatus("تم حذف المنتج.");
      }
    } else {
      setStatus("تعذر حذف المنتج.");
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      id: product.id,
      sku: product.sku ?? "",
      internalSku: product.internalSku ?? "",
      supplierSku: product.supplierSku ?? "",
      barcode: product.barcode ?? "",
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      type: product.type,
      weight: product.weight ?? "",
      unitWeightGrams: product.unitWeightGrams != null ? String(product.unitWeightGrams) : "",
      packSize: product.packSize ?? "",
      packsPerCarton: product.packsPerCarton != null ? String(product.packsPerCarton) : "",
      unitsPerCarton: product.unitsPerCarton != null ? String(product.unitsPerCarton) : "",
      cartonsPerPallet: product.cartonsPerPallet != null ? String(product.cartonsPerPallet) : "",
      palletsPerContainer: product.palletsPerContainer != null ? String(product.palletsPerContainer) : "",
      cartonsPerContainer: product.cartonsPerContainer != null ? String(product.cartonsPerContainer) : "",
      minimumOrderQuantity: product.minimumOrderQuantity != null ? String(product.minimumOrderQuantity) : "",
      originCountry: product.originCountry ?? "",
      imageUrl: product.imageUrl ?? "",
      cartonPurchase: product.cartonPurchase,
      cartonSale: product.cartonSale,
      shippingCost: product.shippingCost,
      customsCost: product.customsCost,
      active: product.active,
      isVerified: product.isVerified,
      supplierId: product.supplierId ?? "",
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-8 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">إضافة / تعديل منتج</h2>
            <p className="mt-2 text-sm text-muted">
              الحقول الاختيارية تترك فارغة حتى يتم تأكيدها من فاتورة المورد أو قائمة التعبئة، عندها فعّل خيار &quot;بيانات موثقة&quot; ليظهر المنتج على الموقع العام.
            </p>
          </div>
          {editingId ? (
            <button type="button" onClick={() => resetForm()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-background">
              <X className="h-4 w-4" aria-hidden="true" />
              إلغاء التعديل
            </button>
          ) : null}
        </div>

        <fieldset className="space-y-5">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">الهوية الأساسية</legend>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground">
              الاسم العربي
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              الاسم الإنجليزي
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              التشكيلة / النوع
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary">
                {["Penne", "Elbow", "Elbow No. 24", "Rigatoni Long", "Rigatoni Short", "Vermicelli", "Spiral", "Fusilli", "Spaghetti No. 1", "Spaghetti No. 5", "Fettuccini", "Tagliatelli", "Penne Whole Wheat", "Fusilli Whole Wheat"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-foreground">
              المورد / المصنع
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary">
                <option value="">— غير محدد —</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.nameAr}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-foreground">
              SKU خارجي
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              SKU داخلي
              <input value={form.internalSku} onChange={(e) => setForm({ ...form, internalSku: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              SKU المورد
              <input value={form.supplierSku} onChange={(e) => setForm({ ...form, supplierSku: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              باركود
              <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-border pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">العبوة واللوجستيات</legend>
          <p className="text-xs text-muted">اترك الحقل فارغاً إذا لم يتم تأكيد القيمة من المورد بعد.</p>
          <div className="grid gap-5 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-foreground">
              الوزن (مثل 400g)
              <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              وزن الوحدة بالجرام
              <input type="number" min="0" value={form.unitWeightGrams} onChange={(e) => setForm({ ...form, unitWeightGrams: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              حجم العبوة (مثل 400g x 24)
              <input value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              عدد العبوات بالكرتون
              <input type="number" min="0" value={form.packsPerCarton} onChange={(e) => setForm({ ...form, packsPerCarton: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              عدد الوحدات بالكرتون
              <input type="number" min="0" value={form.unitsPerCarton} onChange={(e) => setForm({ ...form, unitsPerCarton: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              عدد الكراتين على الطبلية
              <input type="number" min="0" value={form.cartonsPerPallet} onChange={(e) => setForm({ ...form, cartonsPerPallet: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              عدد الطبليات بالحاوية
              <input type="number" min="0" value={form.palletsPerContainer} onChange={(e) => setForm({ ...form, palletsPerContainer: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              إجمالي الكراتين بالحاوية
              <input type="number" min="0" value={form.cartonsPerContainer} onChange={(e) => setForm({ ...form, cartonsPerContainer: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              الحد الأدنى للطلب
              <input type="number" min="0" value={form.minimumOrderQuantity} onChange={(e) => setForm({ ...form, minimumOrderQuantity: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground lg:col-span-2">
              بلد المنشأ
              <input value={form.originCountry} onChange={(e) => setForm({ ...form, originCountry: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-border pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">التكلفة والتسعير (داخلي فقط)</legend>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground">
              سعر شراء الكرتون
              <input type="number" value={form.cartonPurchase} onChange={(e) => setForm({ ...form, cartonPurchase: Number(e.target.value) })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              سعر بيع الكرتون
              <input type="number" value={form.cartonSale} onChange={(e) => setForm({ ...form, cartonSale: Number(e.target.value) })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              تكلفة الشحن
              <input type="number" value={form.shippingCost} onChange={(e) => setForm({ ...form, shippingCost: Number(e.target.value) })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              التخليص والجمارك
              <input type="number" value={form.customsCost} onChange={(e) => setForm({ ...form, customsCost: Number(e.target.value) })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-border pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">العرض والتحقق</legend>
          <label className="space-y-2 text-sm text-foreground">
            رابط الصورة
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="mt-1 h-5 w-5 rounded border border-border text-primary focus:ring-primary" />
              <span>
                <span className="block font-semibold">نشط في الكتالوج</span>
                <span className="block text-xs text-muted">إذا أُلغي، لن يظهر في صفحة المنتجات حتى لو كان موثقاً.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
              <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} className="mt-1 h-5 w-5 rounded border border-border text-primary focus:ring-primary" />
              <span>
                <span className="block font-semibold">بيانات موثقة من المورد</span>
                <span className="block text-xs text-muted">يجب تأكيد الوزن وبلد المنشأ من فاتورة/قائمة تعبئة قبل التفعيل. الوزن والمنشأ يظهران على الموقع العام فقط عند تفعيل هذا الخيار.</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving ? "جاري الحفظ..." : editingId ? "تحديث المنتج" : "إضافة المنتج"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">قائمة المنتجات</h2>
        <div className="mt-6 grid gap-4">
          {products.length === 0 ? (
            <p className="text-sm text-muted">لا توجد منتجات بعد.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-lg border border-border bg-background p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{product.nameAr} — {product.nameEn}</p>
                    <p className="text-xs text-muted">
                      {product.type} • وزن: {showOrUnverified(product.weight)} • منشأ: {showOrUnverified(product.originCountry)} • عبوات/كرتون: {showOrUnverified(product.packsPerCarton)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${product.active ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"}`}>
                        {product.active ? "نشط في الكتالوج" : "معطل"}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${product.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {product.isVerified ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            بيانات موثقة
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                            تحتاج توثيق
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(product)} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      تعديل
                    </button>
                    <button type="button" onClick={() => handleDelete(product.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

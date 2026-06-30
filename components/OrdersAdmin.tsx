"use client";

import { useMemo, useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";

type OrderItem = { productId: string; quantity: number; unitPrice: number };

type Product = { id: string; nameAr: string; cartonSale: number };
type Customer = { id: string; name: string };

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string | Date;
  notes?: string | null;
  customer: Customer;
  items: { quantity: number; unitPrice: number; totalPrice: number; product: Product }[];
};

const statusOptions = ["NEW", "REVIEW", "APPROVED", "READY", "DELIVERED", "CANCELLED"];
const statusLabels: Record<string, string> = {
  NEW: "جديد",
  REVIEW: "قيد المراجعة",
  APPROVED: "معتمد",
  READY: "جاهز",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

export default function OrdersAdmin({ initialOrders, products, customers }: { initialOrders: Order[]; products: Product[]; customers: Customer[] }) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [status, setStatus] = useState("NEW");
  const [notes, setNotes] = useState("");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [orderItems]);

  function updateItem(productId: string, quantity: number) {
    setOrderItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.productId !== productId);
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) => (item.productId === productId ? { ...item, quantity } : item));
      }
      const unitPrice = products.find((product) => product.id === productId)?.cartonSale ?? 0;
      return [...current, { productId, quantity, unitPrice }];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId || orderItems.length === 0 || products.length === 0 || customers.length === 0) {
      setMessage("اختر عميلًا واحدًا ومنتجًا واحدًا على الأقل.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, status, notes, items: orderItems }),
    });
    if (response.ok) {
      const order = await response.json();
      setOrders((current) => [order, ...current]);
      setOrderItems([]);
      setNotes("");
      setStatus("NEW");
      setMessage("تم إنشاء الطلب بنجاح.");
    } else {
      setMessage("حدث خطأ أثناء إنشاء الطلب.");
    }
    setSaving(false);
  }

  async function updateStatus(orderId: string, nextStatus: string) {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) {
      const updatedOrder = (await response.json()) as Order;
      setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
      setMessage("تم تحديث حالة الطلب.");
    } else {
      setMessage("تعذر تحديث حالة الطلب.");
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm("هل تريد حذف هذا الطلب؟")) return;
    const response = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
    if (response.ok) {
      setOrders((current) => current.filter((order) => order.id !== orderId));
      setMessage("تم حذف الطلب.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="data-card p-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">إضافة طلب جديد</h2>
          <p className="text-sm text-muted">أنشئ طلبًا جديدًا مع اختيار العميل والمنتجات والكميات.</p>
        </div>
        {customers.length === 0 || products.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-border bg-background p-4 text-sm text-muted">
            أضف عميلاً ومنتجاً واحداً على الأقل قبل إنشاء الطلبات.
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground">
              العميل
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                disabled={customers.length === 0}
                className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-foreground">
              حالة الطلب
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              >
                {statusOptions.map((value) => (
                  <option key={value} value={value}>{statusLabels[value]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-border bg-background p-5">
            <h3 className="text-base font-semibold text-foreground">المنتجات</h3>
            <div className="mt-4 space-y-4">
              {products.map((product) => {
                const item = orderItems.find((entry) => entry.productId === product.id);
                return (
                  <div key={product.id} className="grid gap-4 rounded-lg border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-foreground">{product.nameAr}</p>
                      <p className="text-sm text-muted">سعر الكرتون: {product.cartonSale.toFixed(2)} ر.س</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        value={item?.quantity ?? 0}
                        onChange={(event) => updateItem(product.id, Number(event.target.value))}
                        className="w-24 rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none"
                      />
                      <span className="text-sm text-muted">السعر/الكرتون {product.cartonSale.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="space-y-2 text-sm text-foreground">
            ملاحظات الطلب
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={saving || customers.length === 0 || products.length === 0}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {saving ? "جاري الحفظ..." : "إنشاء الطلب"}
            </button>
            <p className="text-sm text-muted">المجموع: {total.toFixed(2)} ر.س</p>
          </div>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </form>
      </section>

      <section className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">قائمة الطلبات</h2>
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{order.customer.name}</p>
                    <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</p>
                    <p className="mt-2 text-sm">المجموع: {order.totalAmount.toFixed(2)} ر.س</p>
                    {order.notes ? <p className="mt-1 text-sm text-muted">ملاحظات: {order.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      className="rounded-full border border-border bg-white px-4 py-2 text-sm outline-none transition focus:border-primary"
                    >
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>
                          {statusLabels[value]}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleDelete(order.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      حذف
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.product.id}`} className="flex flex-col gap-1 rounded-lg border border-border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
                        {item.product.nameAr}
                      </span>
                      <span className="text-muted">
                        {item.quantity} كرتون × {item.unitPrice.toFixed(2)} = {item.totalPrice.toFixed(2)} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

import { Construction } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description: string;
  bullets?: string[];
};

export default function ComingSoon({ title, description, bullets }: ComingSoonProps) {
  return (
    <div className="data-card space-y-5 p-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <Construction className="h-3.5 w-3.5" aria-hidden="true" />
        قيد التطوير
      </div>
      <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-3xl text-base leading-7 text-muted">{description}</p>
      {bullets && bullets.length > 0 ? (
        <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="rounded-lg border border-border bg-background px-4 py-3">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted">
        هذا القسم محجوز هيكلياً ضمن لوحة التحكم. سيتم تفعيله بعد تأكيد سير العمل التشغيلي وحقول البيانات المطلوبة من المحاسب.
      </p>
    </div>
  );
}

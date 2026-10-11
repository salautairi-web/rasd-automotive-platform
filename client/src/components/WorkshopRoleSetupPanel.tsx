import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  workshopRoleTemplates,
  workshopPermissionCatalog,
} from "../../../shared/workshopRoleTemplates";

export default function WorkshopRoleSetupPanel({
  businessEntityId,
}: {
  businessEntityId: number;
}) {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const utils = trpc.useUtils();
  const install = trpc.workshopRoleTemplates.install.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      setConfirmed(false);
      void utils.adminControl.invalidate();
      void utils.iam.roles.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          تجهيز أدوار المستخدمين
        </CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">
          قوالب على مستوى كيان الورشة، مع فصل مهام الفنية والجودة والفوترة
          وتسجيل القبض. لا تضيف حسابات ولا تمنح عضويات تلقائياً.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workshopRoleTemplates.map(role => (
            <div key={role.key} className="rounded-xl border p-4">
              <h3 className="font-semibold">{role.nameAr}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {role.description}
              </p>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-blue-600">
                  عرض الصلاحيات المحددة
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  {role.actions.map(action => (
                    <li key={action}>
                      {
                        workshopPermissionCatalog.find(
                          item => item.action === action
                        )?.nameAr
                      }
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
        {user?.role === "admin" && (
          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            <label className="flex items-start gap-2 text-sm leading-7">
              <Checkbox
                aria-label="تأكيد تجهيز قوالب الورشة دون منح حسابات"
                checked={confirmed}
                onCheckedChange={checked => setConfirmed(checked === true)}
                className="mt-1"
              />
              <span>
                أوافق على إنشاء قوالب جديدة لهذا الكيان. الأدوار الموجودة
                وتعديلات صلاحياتها لن تُستبدل، ولن تُمنح صلاحيات لأي حساب
                تلقائياً.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!confirmed || install.isPending}
                onClick={() =>
                  install.mutate({ businessEntityId, acknowledged: true })
                }
              >
                {install.isPending
                  ? "جارٍ تجهيز القوالب…"
                  : "تجهيز قوالب الورشة"}
              </Button>
              <Link
                href="/admin/roles"
                className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-sm"
              >
                مراجعة الأدوار وتعيين المستخدمين
              </Link>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              بعد التجهيز، راجع كل دور ثم عيّن المستخدمين يدوياً للكيان المختار
              من الإدارة المركزية. لا تمنح المحاسب أو الفني دور المسؤول العام
              لتجاوز القيود.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

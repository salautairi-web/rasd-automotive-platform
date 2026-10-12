import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./_core/trpc";

/** Only portal routers may use this identity. Internal protectedProcedure still requires OAuth ctx.user. */
export const customerPortalProcedure = publicProcedure.use(
  ({ ctx, next, type }) => {
    const id = ctx.customer?.userId ?? ctx.user?.id;
    if (!id)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "يرجى تسجيل الدخول إلى حساب العميل",
      });
    if (ctx.customer && type === "mutation") {
      const origin = ctx.req.headers?.origin;
      const host = ctx.req.headers?.host;
      if (origin) {
        let matches = false;
        try {
          const parsed = new URL(origin);
          matches =
            ["http:", "https:"].includes(parsed.protocol) &&
            parsed.host === host;
        } catch {}
        if (!matches)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "طلب تعديل غير مسموح من موقع آخر",
          });
      } else if (ctx.req.headers?.["sec-fetch-site"] === "cross-site") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "طلب تعديل غير مسموح من موقع آخر",
        });
      }
    }
    return next({ ctx: { ...ctx, portalIdentity: { id } } });
  }
);

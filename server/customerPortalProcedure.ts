import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./_core/trpc";
import { assertCsrf } from "./customerAuth";

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
      assertCsrf(ctx.req);
    }
    return next({ ctx: { ...ctx, portalIdentity: { id } } });
  }
);

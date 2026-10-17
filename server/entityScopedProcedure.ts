import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { assertEntityMembership } from "./entityAccess";
import { protectedProcedure } from "./_core/trpc";

/**
 * Shared tenant boundary for specialized routers. The input contract is
 * merged with each procedure's own schema, so every call carries the entity
 * selected by the user and the server verifies active IAM membership first.
 */
export const entityScopedProcedure = protectedProcedure
  .input(z.object({ businessEntityId: z.number().int().positive() }))
  .use(async ({ ctx, input, next }) => {
    if (ctx.user.role !== "admin") {
      await assertEntityMembership(ctx.user.id, ctx.user.role, input.businessEntityId);
    }
    if (!Number.isInteger(input.businessEntityId) || input.businessEntityId <= 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "كيان العمل غير صالح" });
    }
    return next();
  });

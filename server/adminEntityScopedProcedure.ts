import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure } from "./_core/trpc";

/**
 * Administrative tenant boundary for operations that are both admin-only and
 * explicitly scoped to one business entity. Central admins may operate across
 * entities, but the entity identifier must still be present and valid.
 */
export const adminEntityScopedProcedure = adminProcedure
  .input(z.object({ businessEntityId: z.number().int().positive() }))
  .use(async ({ input, next }) => {
    if (
      !Number.isInteger(input.businessEntityId) ||
      input.businessEntityId <= 0
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "كيان العمل غير صالح",
      });
    }
    return next();
  });

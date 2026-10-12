import { describe, expect, it } from "vitest";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { customerPortalProcedure } from "./customerPortalProcedure";
import type { TrpcContext } from "./_core/context";
const demo = router({
  write: customerPortalProcedure.mutation(({ ctx }) => ({
    id: ctx.portalIdentity.id,
  })),
  portal: customerPortalProcedure.query(({ ctx }) => ({
    id: ctx.portalIdentity.id,
  })),
  employee: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id })),
  admin: adminProcedure.query(() => true),
});
const actor = {
  userId: 42,
  credentialId: 11,
  sessionId: 12,
  name: "عميل",
  email: "qa@example.invalid",
  phone: "+96890000001",
};
const ctx = { req: {}, res: {}, user: null, customer: actor } as TrpcContext;
describe("Customer session separation", () => {
  it("accepts the dedicated customer actor for customer portal procedures", async () => {
    await expect(demo.createCaller(ctx).portal()).resolves.toEqual({ id: 42 });
  });
  it("does not treat a customer cookie as an employee identity", async () => {
    await expect(demo.createCaller(ctx).employee()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(demo.createCaller(ctx).admin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("keeps existing OAuth portal users usable", async () => {
    await expect(
      demo
        .createCaller({
          ...ctx,
          customer: null,
          user: { id: 9, role: "user" } as any,
        })
        .portal()
    ).resolves.toEqual({ id: 9 });
  });
  it("prefers the selected customer identity without borrowing a concurrently signed-in administrator", async () => {
    await expect(
      demo
        .createCaller({ ...ctx, user: { id: 1, role: "admin" } as any })
        .portal()
    ).resolves.toEqual({ id: 42 });
  });
  it("does not accept anonymous portal access", async () => {
    await expect(
      demo.createCaller({ ...ctx, customer: null }).portal()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("rejects cross-site portal mutations even with a valid customer session", async () => {
    const cross = {
      ...ctx,
      req: {
        headers: { host: "rasd.example", origin: "https://other.example" },
      } as any,
    };
    await expect(demo.createCaller(cross).write()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const same = {
      ...ctx,
      req: {
        headers: { host: "rasd.example", origin: "https://rasd.example" },
      } as any,
    };
    await expect(demo.createCaller(same).write()).resolves.toEqual({ id: 42 });
  });
  it("rejects explicit cross-site fetch metadata without origin", async () => {
    const cross = {
      ...ctx,
      req: {
        headers: { host: "rasd.example", "sec-fetch-site": "cross-site" },
      } as any,
    };
    await expect(demo.createCaller(cross).write()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

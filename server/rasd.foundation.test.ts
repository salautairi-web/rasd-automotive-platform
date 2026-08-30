import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 7, openId: "rasd-test", email: "test@rasd.om", name: "RASD Test", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("RASD foundation", () => {
  it("returns a permission-scoped overview for an authenticated administrator", async () => {
    const result = await appRouter.createCaller(context("admin")).rasd.overview();
    expect(result).toMatchObject({ organizationCount: expect.any(Number), pendingEventCount: expect.any(Number), failedEventCount: expect.any(Number) });
  });

  it("blocks sensitive event intake for non-admin users", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.rasd.intakeEvent({ eventId: "event-123456", eventType: "VehicleCreated", sourceSystem: "master-data", entityType: "vehicle", entityId: "VH-2026-000001", payload: {}, idempotencyKey: "idem-123456" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects malformed critical event payloads before execution", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.rasd.intakeEvent({ eventId: "x", eventType: "", sourceSystem: "", entityType: "vehicle", entityId: "", payload: {}, idempotencyKey: "idem-123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

import { describe, expect, it } from "vitest";
import { canDeliverVehicle, canReserveVehicle, quotationStatus } from "../shared/auto-sales";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "sales-test-user",
      name: "Sales Tester",
      email: "sales@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Auto Sales lifecycle rules", () => {
  it("permits reservation only for ready vehicles", () => {
    expect(canReserveVehicle("ready")).toBe(true);
    expect(canReserveVehicle("reserved")).toBe(false);
    expect(canReserveVehicle("sold")).toBe(false);
  });

  it("requires approval when discount exceeds the configured threshold", () => {
    expect(quotationStatus(100000, 5000)).toBe("approved");
    expect(quotationStatus(100000, 15000)).toBe("pending_approval");
  });

  it("requires a reserved vehicle and approved or paid order for delivery", () => {
    expect(canDeliverVehicle("reserved", "approved")).toBe(true);
    expect(canDeliverVehicle("reserved", "paid")).toBe(true);
    expect(canDeliverVehicle("ready", "paid")).toBe(false);
    expect(canDeliverVehicle("reserved", "draft")).toBe(false);
  });
});

describe("Auto Sales protected procedure contracts", () => {
  it("rejects reservations with an invalid idempotency key before database work", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.sales.reserveVehicle({
      businessEntityId: 1,
      customerId: 1,
      vehicleId: 1,
      amountMinor: 0,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      idempotencyKey: "short",
    })).rejects.toThrow();
  });

  it("rejects payment requests without a valid entity scope", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.sales.postPayment({
      businessEntityId: 0,
      invoiceId: 1,
      paymentNo: "PAY-1",
      amountMinor: 1000,
      method: "cash",
      idempotencyKey: "payment-key-001",
    })).rejects.toThrow();
  });

  it("rejects an unauthenticated sales dashboard request", async () => {
    const ctx = { ...authenticatedContext(), user: null } as TrpcContext;
    await expect(appRouter.createCaller(ctx).sales.dashboard({ businessEntityId: 1 })).rejects.toThrow();
  });
});

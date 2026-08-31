import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({
  selectResponses: [] as Array<Array<Record<string, unknown>>>,
  insertCount: 0,
  updateCount: 0,
}));

vi.mock("./db", () => {
  const nextRows = () => state.selectResponses.shift() ?? [];
  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => nextRows(),
      }),
    }),
  });
  const fakeDb: any = {
    select,
    insert: () => ({ values: async () => { state.insertCount += 1; return [{ insertId: 1 }]; } }),
    update: () => ({ set: () => ({ where: async () => { state.updateCount += 1; return [{ affectedRows: 1 }]; } }) }),
  };
  fakeDb.transaction = async (work: (tx: typeof fakeDb) => unknown) => work(fakeDb);
  return {
    getDb: async () => fakeDb,
    createAuditLog: vi.fn(),
    enqueueEvent: vi.fn(async () => ({ accepted: true, duplicate: false })),
    getRasdOverview: vi.fn(async () => ({})),
  };
});

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: {
      id: 9,
      openId: "sales-procedure-user",
      name: "Sales Procedure Tester",
      email: "sales-procedure@example.com",
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

describe("Auto Sales persisted procedure behavior", () => {
  beforeEach(() => {
    state.selectResponses = [];
    state.insertCount = 0;
    state.updateCount = 0;
  });

  it("denies a quotation when both persisted records belong to different entities", async () => {
    state.selectResponses = [[{ id: 11, businessEntityId: 1 }], [{ id: 22, businessEntityId: 2 }]];
    await expect(appRouter.createCaller(context()).sales.createQuotation({
      businessEntityId: 1,
      customerId: 11,
      vehicleId: 22,
      targetPriceMinor: 20_000,
      discountMinor: 0,
      taxMinor: 0,
      validUntil: new Date(Date.now() + 86_400_000),
      correlationId: "sales-test-correlation",
    })).rejects.toThrow("same sales entity");
    expect(state.insertCount).toBe(0);
  });

  it("replays an existing reservation without changing vehicle state", async () => {
    state.selectResponses = [[{ reservationNo: "SALES-RES-001" }]];
    const result = await appRouter.createCaller(context()).sales.reserveVehicle({
      businessEntityId: 1,
      customerId: 11,
      vehicleId: 22,
      amountMinor: 500,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      idempotencyKey: "reservation-key-001",
    });
    expect(result).toEqual({ reservationNo: "SALES-RES-001", replay: true });
    expect(state.updateCount).toBe(0);
  });

  it("replays a confirmed payment without a duplicate insert", async () => {
    state.selectResponses = [[{ paymentNo: "PAY-001" }]];
    const result = await appRouter.createCaller(context()).sales.postPayment({
      businessEntityId: 1,
      invoiceId: 15,
      paymentNo: "PAY-001",
      amountMinor: 1_000,
      method: "bank",
      idempotencyKey: "payment-key-001",
    });
    expect(result).toEqual({ paymentNo: "PAY-001", replay: true });
    expect(state.insertCount).toBe(0);
  });

  it("rejects delivery when the persisted vehicle is not reserved", async () => {
    state.selectResponses = [[{ status: "ready" }], [{ status: "paid" }]];
    await expect(appRouter.createCaller(context()).sales.deliverVehicle({
      businessEntityId: 1,
      salesOrderId: 3,
      vehicleId: 4,
      deliveryNo: "DEL-001",
      recipientName: "العميل",
      checklistJson: "{}",
    })).rejects.toThrow("reserved and financially approved");
    expect(state.insertCount).toBe(0);
  });
});

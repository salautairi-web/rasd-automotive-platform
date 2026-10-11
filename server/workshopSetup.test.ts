import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getTableName } from "drizzle-orm";
const state = vi.hoisted(() => ({
  rows: [] as unknown[][],
  writes: [] as Array<{ table: string; data: any }>,
  permissions: vi.fn(),
}));
vi.mock("./workshopAccess", () => ({
  assertWorkshopPermission: state.permissions,
}));
vi.mock("./db", () => ({ getDb: async () => database }));
const select = () => {
  const rows = state.rows.shift() ?? [];
  const chain: any = {
    from: () => chain,
    where: () => chain,
    limit: () => chain,
    for: () => chain,
    innerJoin: () => chain,
    then: (resolve: (value: unknown[]) => void) => resolve(rows),
  };
  return chain;
};
const database: any = {
  select,
  transaction: async (fn: (tx: any) => Promise<unknown>) => fn(database),
  insert: (table: any) => ({
    values: (data: any) => {
      state.writes.push({ table: getTableName(table), data });
      return {
        $returningId: async () => [{ id: 91 }],
        then: (resolve: (value: unknown) => void) =>
          resolve([{ insertId: 91 }]),
      };
    },
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: async () => {
        state.writes.push({ table: getTableName(table), data });
        return [{ affectedRows: 1 }];
      },
    }),
  }),
};
import { workshopSetupRouter } from "./workshopSetup";
const ctx = {
  user: {
    id: 7,
    role: "user",
    openId: "workshop-qa",
    name: "محاسب اختبار",
    email: "qa@example.invalid",
    loginMethod: "manus",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {},
  res: {},
} as TrpcContext;
const caller = () => workshopSetupRouter.createCaller(ctx);
const job = {
  id: 11,
  businessEntityId: 2,
  customerId: 22,
  vehicleId: 33,
  estimateId: 44,
  status: "ready",
};
const invoice = {
  id: 55,
  businessEntityId: 2,
  sourceSystem: "workshop59",
  sourceRecordId: "11",
  invoiceNo: "WS-INV-11",
  amountMinor: 10000,
  paidAmountMinor: 4000,
  currency: "OMR",
  status: "partially_paid",
};
const paymentInput = {
  businessEntityId: 2,
  jobCardId: 11,
  amountMinor: 3000,
  method: "cash" as const,
  reference: "RCP-11",
  receivedConfirmation: true as const,
  idempotencyKey: "receipt-qa-001",
};
beforeEach(() => {
  state.rows = [];
  state.writes = [];
  state.permissions.mockReset().mockResolvedValue(undefined);
});

describe("Workshop release setup and finance", () => {
  it("checks entity configure permission before creating a bay and records audit", async () => {
    state.rows = [[]];
    await caller().createBay({
      businessEntityId: 2,
      bayCode: "BAY-01",
      nameAr: "الصيانة",
    });
    expect(state.permissions).toHaveBeenCalledWith(ctx.user, 2, "configure");
    expect(state.writes.map(x => x.table)).toEqual([
      "workshop_bays_59",
      "iam_security_events",
    ]);
    expect(state.writes[0].data.businessEntityId).toBe(2);
  });
  it("denies configuration without inserting any record", async () => {
    state.permissions.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(
      caller().createTechnician({
        businessEntityId: 2,
        technicianNo: "T-1",
        nameAr: "فني",
        department: "المحرك",
      })
    ).rejects.toThrow();
    expect(state.writes).toEqual([]);
  });
  it("does not issue an invoice without customer approval", async () => {
    state.rows = [[job], [], [{ id: 44, status: "draft", totalMinor: 10000 }]];
    await expect(
      caller().issueInvoice({
        businessEntityId: 2,
        jobCardId: 11,
        invoiceNo: "WS-INV-11",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("links invoice source explicitly to the new job, not the legacy work-order ID namespace", async () => {
    state.rows = [
      [job],
      [],
      [{ id: 44, status: "approved", totalMinor: 10000, currency: "OMR" }],
      [],
    ];
    await caller().issueInvoice({
      businessEntityId: 2,
      jobCardId: 11,
      invoiceNo: "WS-INV-11",
    });
    expect(state.permissions).toHaveBeenCalledWith(ctx.user, 2, "invoice");
    expect(state.writes[0]).toMatchObject({
      table: "payment_invoices_47",
      data: {
        sourceSystem: "workshop59",
        sourceRecordId: "11",
        businessEntityId: 2,
        amountMinor: 10000,
      },
    });
    expect(state.writes.some(x => x.table === "workshop_invoices")).toBe(false);
  });
  it("replays an existing linked invoice without duplicate insertion", async () => {
    state.rows = [[job], [invoice]];
    await expect(
      caller().issueInvoice({
        businessEntityId: 2,
        jobCardId: 11,
        invoiceNo: "WS-INV-11",
      })
    ).resolves.toMatchObject({ id: 55, replayed: true });
    expect(state.writes).toEqual([]);
  });
  it("requires confirmation that the payment was actually received", async () => {
    await expect(
      caller().recordPayment({
        ...paymentInput,
        receivedConfirmation: false,
      } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes).toEqual([]);
  });
  it("records a receipt and updates the central balance atomically with a separate collect permission", async () => {
    state.rows = [[job], [invoice], []];
    await expect(caller().recordPayment(paymentInput)).resolves.toMatchObject({
      remainingMinor: 3000,
      replayed: false,
    });
    expect(state.permissions).toHaveBeenCalledWith(ctx.user, 2, "collect");
    expect(state.writes[0]).toMatchObject({
      table: "payment_intents_47",
      data: {
        status: "captured",
        providerKey: "workshop-manual",
        invoiceId: 55,
        amountMinor: 3000,
      },
    });
    expect(state.writes[1]).toMatchObject({
      table: "payment_invoices_47",
      data: { paidAmountMinor: 7000, status: "partially_paid" },
    });
    expect(state.writes[2].table).toBe("iam_security_events");
  });
  it("marks the invoice paid when the exact remaining balance is received", async () => {
    state.rows = [[job], [invoice], []];
    await expect(
      caller().recordPayment({ ...paymentInput, amountMinor: 6000 })
    ).resolves.toMatchObject({ remainingMinor: 0 });
    expect(state.writes[1].data).toEqual({
      paidAmountMinor: 10000,
      status: "paid",
    });
  });
  it("blocks overpayment and cancelled invoices before any write", async () => {
    state.rows = [[job], [invoice], []];
    await expect(
      caller().recordPayment({ ...paymentInput, amountMinor: 6001 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes).toEqual([]);
    state.rows = [[job], [{ ...invoice, status: "cancelled" }], []];
    await expect(caller().recordPayment(paymentInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(state.writes).toEqual([]);
  });
  it("replays the same receipt without double counting the invoice balance", async () => {
    state.rows = [
      [job],
      [invoice],
      [
        {
          id: 91,
          invoiceId: 55,
          amountMinor: 3000,
          paymentMethodType: "cash",
          maskedReference: "RCP-11",
          providerKey: "workshop-manual",
          intentRef: "WS-RCP-11",
        },
      ],
    ];
    await expect(caller().recordPayment(paymentInput)).resolves.toMatchObject({
      receiptId: 91,
      replayed: true,
    });
    expect(state.writes).toEqual([]);
  });
  it("rejects reuse of another invoice's payment key", async () => {
    state.rows = [
      [job],
      [invoice],
      [
        {
          id: 91,
          invoiceId: 999,
          amountMinor: 3000,
          paymentMethodType: "cash",
          maskedReference: "RCP-11",
          providerKey: "workshop-manual",
        },
      ],
    ];
    await expect(caller().recordPayment(paymentInput)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(state.writes).toEqual([]);
  });
  it("does not claim readiness when reference data or scoped staff are missing", async () => {
    state.rows = [
      [{ total: 1 }],
      [{ total: 2 }],
      [{ total: 0 }],
      [{ total: 0 }],
      [{ total: 0 }],
    ];
    const result = await caller().readiness({ businessEntityId: 2 });
    expect(result.canStart).toBe(false);
    expect(result.checks.filter(x => !x.passed).map(x => x.key)).toEqual([
      "bays",
      "technicians",
      "staff",
    ]);
    expect(result.limitations).toHaveLength(3);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getTableName } from "drizzle-orm";
const state = vi.hoisted(() => ({
  rows: [] as any[][],
  writes: [] as Array<{ table: string; data: any }>,
  checks: vi.fn(),
  entityUser: vi.fn(),
  selects: 0,
  locks: 0,
  affect: 1,
}));
vi.mock("./db", () => ({ getDb: async () => db }));
vi.mock("./workshopAccess", () => ({
  assertWorkshopPermission: state.checks,
  assertWorkshopEntityUser: state.entityUser,
  getWorkshopAccess: async () => ({ entities: [] }),
}));
vi.mock("./storage", () => ({
  storagePut: vi.fn(async () => ({
    key: "qa-photo",
    url: "/manus-storage/qa-photo",
  })),
}));
const select = () => {
  state.selects++;
  const rows = state.rows.shift() ?? [];
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    innerJoin: () => chain,
    limit: () => chain,
    for: () => {
      state.locks++;
      return chain;
    },
    then: (resolve: any) => resolve(rows),
  };
  return chain;
};
const db: any = {
  select,
  transaction: async (fn: any) => fn(db),
  insert: (table: any) => ({
    values: async (data: any) => {
      state.writes.push({ table: getTableName(table), data });
      return [{ insertId: 81 }];
    },
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: async () => {
        state.writes.push({ table: getTableName(table), data });
        return [{ affectedRows: state.affect }];
      },
    }),
  }),
};
import { workshop59Router } from "./workshop59";
const ctx = {
  user: {
    id: 7,
    role: "user",
    openId: "workshop-qa",
    name: "فني اختبار",
    email: "qa@example.invalid",
    loginMethod: "manus",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {},
  res: {},
} as TrpcContext;
const caller = () => workshop59Router.createCaller(ctx);
const scope = { businessEntityId: 2, jobCardId: 11 };
const job = {
  id: 11,
  businessEntityId: 2,
  checkinId: 10,
  customerId: 22,
  vehicleId: 33,
  estimateId: 44,
  status: "ready",
  jobNo: "WS-QA-11",
  createdAt: new Date(),
  updatedAt: new Date(),
};
const quality = {
  result: "passed",
  approvedAt: new Date(),
  createdAt: new Date(),
};
const invoice = {
  id: 55,
  amountMinor: 10000,
  paidAmountMinor: 10000,
  status: "paid",
  currency: "OMR",
};
const checkin = {
  id: 10,
  mileage: 1000,
  consent: true,
  customerId: 22,
  vehicleId: 33,
};
const deliverInput = {
  ...scope,
  customerId: 22,
  mileage: 1001,
  customerAcknowledgement: true as const,
  documentsJson: JSON.stringify({ references: "محضر اختبار" }),
  idempotencyKey: "ws-delivery-test-001",
};
beforeEach(() => {
  state.rows = [];
  state.writes = [];
  state.selects = 0;
  state.locks = 0;
  state.affect = 1;
  state.checks.mockReset().mockResolvedValue(undefined);
  state.entityUser.mockReset().mockResolvedValue(undefined);
});

describe("Workshop guarded real procedures", () => {
  it("receives parsed entity input before the permission middleware, not raw input", async () => {
    state.rows = [[], []];
    await caller().dashboard({ businessEntityId: 2 });
    expect(state.checks).toHaveBeenCalledWith(ctx.user, 2, "read");
    expect(state.selects).toBeGreaterThan(0);
  });
  it("rejects a user without permission before querying workshop data", async () => {
    state.checks.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(caller().dashboard({ businessEntityId: 2 })).rejects.toThrow();
    expect(state.selects).toBe(0);
  });
  it("does not read a job absent from the selected entity", async () => {
    state.rows = [[]];
    await expect(caller().jobDetails(scope)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(state.writes).toEqual([]);
  });
  it("disallows direct transition to delivered and bypass through legacy unlinked job creation", async () => {
    state.rows = [[job]];
    await expect(
      caller().transitionJobCard({ ...scope, from: "ready", to: "delivered" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(
      caller().createJobCard({
        businessEntityId: 2,
        customerId: 22,
        vehicleId: 33,
        jobNo: "WS-NO-RECEPTION",
        idempotencyKey: "ws-bypass-test",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("requires approval before entering repair", async () => {
    state.rows = [
      [{ ...job, status: "diagnosing" }],
      [{ id: 44, status: "draft" }],
    ];
    await expect(
      caller().transitionJobCard({
        ...scope,
        from: "diagnosing",
        to: "in_progress",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("rejects a forged passed quality result with an empty checklist", async () => {
    state.rows = [[{ ...job, status: "qc" }]];
    await expect(
      caller().recordQuality({
        ...scope,
        result: "passed",
        checklistJson: "{}",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("records the real inspector and completed substantive checklist", async () => {
    state.rows = [[{ ...job, status: "qc" }]];
    await caller().recordQuality({
      ...scope,
      result: "passed",
      checklistJson: JSON.stringify({
        repair: true,
        safety: true,
        fluids: true,
        cleanliness: true,
      }),
    });
    expect(state.checks).toHaveBeenCalledWith(ctx.user, 2, "quality");
    expect(state.writes[0].data.inspectorUserId).toBe(7);
    expect(state.writes[0].data.approvedAt).toBeInstanceOf(Date);
  });
  it("does not allow repair operation edits after the job is ready", async () => {
    state.rows = [[{ id: 61, jobCardId: 11, actualHours: "1" }], [job]];
    await expect(
      caller().updateOperation({
        businessEntityId: 2,
        operationId: 61,
        status: "completed",
        actualHours: "1",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("rejects malformed actual hours through direct API calls", async () => {
    await expect(
      caller().updateOperation({
        businessEntityId: 2,
        operationId: 61,
        status: "completed",
        actualHours: "-3",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes).toEqual([]);
  });
  it("rejects a forged estimate checksum without changing approval", async () => {
    state.rows = [
      [
        {
          id: 44,
          businessEntityId: 2,
          customerId: 22,
          vehicleId: 33,
          version: 1,
          totalMinor: 10000,
          currency: "OMR",
        },
      ],
    ];
    await expect(
      caller().recordEstimateConsent({
        businessEntityId: 2,
        estimateId: 44,
        customerId: 22,
        version: 1,
        decision: "approved",
        estimateChecksum: "a".repeat(64),
        reason: "مرجع اختبار",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.writes).toEqual([]);
  });
  it("checks full invoice payment from the database, not client paid flags", async () => {
    state.rows = [
      [job],
      [],
      [quality],
      [{ status: "completed" }],
      [{ ...invoice, paidAmountMinor: 0, status: "issued" }],
    ];
    await expect(
      caller().deliver({
        ...deliverInput,
        invoiceStatus: "paid",
        paymentStatus: "paid",
        qcPassed: true,
      } as any)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("requires a real successful latest QC record despite a supplied client flag", async () => {
    state.rows = [[job], [], [{ result: "failed" }]];
    await expect(
      caller().deliver({ ...deliverInput, qcPassed: true } as any)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("requires substantive document references rather than a nonempty arbitrary JSON object", async () => {
    state.rows = [[job], []];
    await expect(
      caller().deliver({ ...deliverInput, documentsJson: '{"ok":true}' })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("blocks decreasing mileage relative to the linked reception or road test", async () => {
    state.rows = [
      [job],
      [],
      [quality],
      [{ status: "completed" }],
      [invoice],
      [checkin],
      [
        {
          status: "completed",
          startMileage: 1000,
          endMileage: 1005,
          incident: false,
        },
      ],
    ];
    await expect(caller().deliver(deliverInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(state.writes).toEqual([]);
  });
  it("delivers atomically, with a locked job and invoice and an audit record", async () => {
    state.rows = [
      [job],
      [],
      [quality],
      [{ status: "completed" }],
      [invoice],
      [checkin],
      [],
    ];
    await expect(caller().deliver(deliverInput)).resolves.toMatchObject({
      status: "delivered",
    });
    expect(state.checks).toHaveBeenCalledWith(ctx.user, 2, "deliver");
    expect(state.locks).toBeGreaterThanOrEqual(2);
    expect(state.writes.map(write => write.table)).toEqual([
      "workshop_deliveries_59",
      "workshop_job_cards_59",
      "iam_security_events",
    ]);
  });
  it("blocks reopening a converted reception into a duplicate job", async () => {
    state.rows = [[{ ...checkin, status: "converted" }], []];
    await expect(
      caller().openJobCard({
        businessEntityId: 2,
        customerId: 22,
        vehicleId: 33,
        checkinId: 10,
        jobNo: "WS-DUPLICATE",
        idempotencyKey: "ws-new-key",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.writes).toEqual([]);
  });
  it("blocks part issues whose quantity does not match the reservation", async () => {
    state.rows = [[], [{ id: 61, status: "reserved", quantity: 3 }]];
    await expect(
      caller().issuePart({
        businessEntityId: 2,
        requestId: 61,
        quantity: 2,
        idempotencyKey: "ws-issue-test",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.writes).toEqual([]);
  });
  it("blocks road-test odometer rollback", async () => {
    state.rows = [
      [{ id: 61, jobCardId: 11, status: "authorized", startMileage: 1000 }],
      [{ ...job, status: "road_test" }],
    ];
    await expect(
      caller().completeRoadTest({
        businessEntityId: 2,
        roadTestId: 61,
        endMileage: 999,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.writes).toEqual([]);
  });
  it("rejects image payloads whose real header does not match their MIME", async () => {
    state.rows = [[job]];
    await expect(
      caller().uploadInspectionMedia({
        ...scope,
        fileName: "photo.png",
        contentType: "image/png",
        dataUrl: `data:image/png;base64,${Buffer.alloc(100, 65).toString("base64")}`,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("uses a random safe storage filename even for Arabic source filenames", async () => {
    state.rows = [[job]];
    const bytes = Buffer.alloc(100);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
    await expect(
      caller().uploadInspectionMedia({
        ...scope,
        fileName: "صورة المحرك.png",
        contentType: "image/png",
        dataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
      })
    ).resolves.toMatchObject({ jobCardId: 11 });
  });
  it("does not mark inventory issued when the guarded stock update fails", async () => {
    state.rows = [
      [],
      [
        {
          id: 61,
          status: "reserved",
          quantity: 3,
          warehouseId: 77,
          productId: 88,
        },
      ],
    ];
    state.affect = 0;
    await expect(
      caller().issuePart({
        businessEntityId: 2,
        requestId: 61,
        quantity: 3,
        idempotencyKey: "ws-stock-failed",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      state.writes.some(write => write.table === "parts_inventory_movements")
    ).toBe(false);
  });
});

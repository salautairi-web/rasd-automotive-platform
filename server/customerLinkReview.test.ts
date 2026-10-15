import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./iam", () => ({ hasActiveMfa: vi.fn() }));

import { customerLinkReviewRouter } from "./customerLinkReview";
import { getDb } from "./db";
import { hasActiveMfa } from "./iam";

type Table = { [key: string]: unknown };
type Row = Record<string, any>;

type MockState = {
  rows: Map<string, Row[][]>;
  locks: string[];
  selects: string[];
  writes: Array<{ action: string; table: string; values?: Row }>;
  transactions: number;
  nextId: number;
};

const tableName = (table: Table) => String(table[Symbol.for("drizzle:Name")]);

class SelectQuery implements PromiseLike<Row[]> {
  private table?: Table;
  private state: MockState;
  private db: FakeDb;
  constructor(db: FakeDb, state: MockState) {
    this.db = db;
    this.state = state;
  }
  from(table: Table) {
    this.table = table;
    this.state.selects.push(tableName(table));
    return this;
  }
  innerJoin() {
    return this;
  }
  leftJoin() {
    return this;
  }
  where() {
    return this;
  }
  orderBy() {
    return this;
  }
  limit() {
    return this;
  }
  for(lock: string) {
    if (lock === "update" && this.table)
      this.state.locks.push(tableName(this.table));
    return Promise.resolve(this.result());
  }
  private result() {
    const name = this.table ? tableName(this.table) : "unknown";
    const queue = this.state.rows.get(name) ?? [];
    return queue.length ? queue.shift()! : [];
  }
  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result()).then(onfulfilled, onrejected);
  }
}

class MutationQuery implements PromiseLike<Array<{ insertId?: number }>> {
  private action: "insert" | "update";
  private table: Table;
  private state: MockState;
  private values_: Row = {};
  constructor(action: "insert" | "update", table: Table, state: MockState) {
    this.action = action;
    this.table = table;
    this.state = state;
  }
  values(values: Row) {
    this.values_ = values;
    return this;
  }
  set(values: Row) {
    this.values_ = values;
    return this;
  }
  where() {
    return this;
  }
  then<TResult1 = Array<{ insertId?: number }>, TResult2 = never>(
    onfulfilled?:
      | ((
          value: Array<{ insertId?: number }>
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const table = tableName(this.table);
    this.state.writes.push({
      action: this.action,
      table,
      values: this.values_,
    });
    const value =
      this.action === "insert"
        ? [{ insertId: this.state.nextId++ }]
        : ([] as Array<{ insertId?: number }>);
    return Promise.resolve(value).then(onfulfilled, onrejected);
  }
}

class FakeDb {
  state: MockState;
  constructor(state: MockState) {
    this.state = state;
  }
  select() {
    return new SelectQuery(this, this.state);
  }
  insert(table: Table) {
    return new MutationQuery("insert", table, this.state);
  }
  update(table: Table) {
    return new MutationQuery("update", table, this.state);
  }
  async transaction<T>(callback: (tx: this) => Promise<T>) {
    this.state.transactions++;
    return callback(this);
  }
}

const actor = {
  userId: 12,
  credentialId: 44,
  sessionId: 900,
  name: "عميل محلي",
  email: "owner@example.invalid",
  phone: "+96890000001",
};
const credential = {
  id: 44,
  userId: actor.userId,
  email: actor.email,
  phone: actor.phone,
  status: "active",
  emailVerifiedAt: new Date(Date.now() - 60 * 60 * 1000),
  phoneVerifiedAt: new Date(Date.now() - 60 * 60 * 1000),
};
const relationship = {
  id: 9,
  portalUserId: 71,
  businessEntityId: 4,
  relationshipType: "customer",
  sourceProfileId: 101,
  status: "active",
};
const portalUser = {
  id: 71,
  userId: actor.userId,
  userType: "customer",
  status: "active",
};
const target = {
  id: 202,
  customerNo: "LEG-202",
  organizationId: 3,
  businessEntityId: 4,
  nameAr: "عميل سابق",
  nameEn: "Legacy Customer",
  email: actor.email,
  phone: actor.phone,
  status: "active",
};
const original = {
  id: 101,
  customerNo: "PROV-101",
  organizationId: 3,
  businessEntityId: 4,
  nameAr: "حساب التسجيل",
  email: actor.email,
  phone: actor.phone,
  status: "active",
};
const activeRelation = { relationship, portalUser };
const activeProfile = {
  id: 301,
  userId: actor.userId,
  businessEntityId: 4,
  profileType: "customer",
  localRecordType: "customer",
  localRecordId: original.id,
  status: "active",
};

function state() {
  return {
    rows: new Map<string, Row[][]>(),
    locks: [],
    selects: [],
    writes: [],
    transactions: 0,
    nextId: 700,
  } satisfies MockState;
}
function queue(s: MockState, table: string, ...answers: Row[][]) {
  s.rows.set(table, answers);
}
function requestScope(s: MockState) {
  queue(s, "portal_entity_relationships", [{ relationship, portalUser }]);
}
function requestInput() {
  return {
    businessEntityId: 4,
    relationshipId: relationship.id,
    customerNo: target.customerNo,
    requesterNote: "أملك بيانات الاتصال وأطلب مراجعة السجل السابق.",
  };
}
function customerCtx(extra: Record<string, unknown> = {}) {
  return {
    req: { headers: {} },
    res: {},
    user: null,
    customer: actor,
    ...extra,
  } as any;
}
function adminCtx(extra: Record<string, unknown> = {}) {
  return {
    req: { headers: {} },
    res: {},
    customer: null,
    user: { id: 501, role: "admin" },
    ...extra,
  } as any;
}
function reviewRows(
  s: MockState,
  overrides: {
    credential?: Row;
    target?: Row;
    profile?: Row;
    original?: Row;
  } = {}
) {
  queue(
    s,
    "customer_link_requests",
    [{ credentialId: actor.credentialId }],
    [
      {
        request: {
          id: 77,
          credentialId: actor.credentialId,
          userId: actor.userId,
          businessEntityId: 4,
          relationshipId: relationship.id,
          customerNo: target.customerNo,
          status: "pending",
        },
        relationship,
      },
    ]
  );
  queue(s, "customer_credentials", [overrides.credential ?? credential]);
  queue(
    s,
    "customers",
    [overrides.target ?? target],
    [overrides.original ?? original]
  );
  queue(s, "portal_entity_relationships", [activeRelation]);
  queue(s, "portal_profiles", [overrides.profile ?? activeProfile], []);
  queue(s, "customer_registration_settings", [{ organizationId: 3 }]);
  queue(s, "customer_verified_links", [], []);
  queue(s, "portal_entity_relationships", [activeRelation], []);
}

let db: FakeDb;
let s: MockState;

beforeEach(() => {
  vi.clearAllMocks();
  s = state();
  db = new FakeDb(s);
  vi.mocked(getDb).mockResolvedValue(db as any);
  vi.mocked(hasActiveMfa).mockResolvedValue(true);
});

describe("customerLinkReviewRouter", () => {
  it("creates a pending request only inside the selected active customer scope", async () => {
    requestScope(s);
    queue(s, "customer_credentials", [credential]);
    queue(s, "customer_link_requests", []);
    queue(s, "customer_verified_links", []);

    const result = await customerLinkReviewRouter
      .createCaller(customerCtx())
      .request(requestInput());

    expect(result).toEqual({ id: 700, status: "pending", replay: false });
    expect(s.transactions).toBe(1);
    expect(s.locks).toEqual([
      "customer_credentials",
      "portal_entity_relationships",
      "customer_link_requests",
      "customer_verified_links",
    ]);
    expect(s.selects).not.toContain("customers");
    expect(
      s.writes.find(w => w.table === "customer_link_requests")?.values
    ).toMatchObject({
      credentialId: actor.credentialId,
      userId: actor.userId,
      businessEntityId: 4,
      relationshipId: relationship.id,
      customerNo: target.customerNo,
      status: "pending",
    });
  });

  it("returns the existing pending or approved request as a replay and never creates a second one", async () => {
    requestScope(s);
    queue(s, "customer_credentials", [credential]);
    queue(s, "customer_link_requests", [{ id: 88, status: "approved" }]);

    const result = await customerLinkReviewRouter
      .createCaller(customerCtx())
      .request(requestInput());

    expect(result).toEqual({ id: 88, status: "approved", replay: true });
    expect(s.writes).toEqual([]);
  });

  it("rejects malformed and cross-entity requests without touching master customers", async () => {
    await expect(
      customerLinkReviewRouter.createCaller(customerCtx()).request({
        ...requestInput(),
        customerNo: "",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(vi.mocked(getDb)).not.toHaveBeenCalled();

    queue(s, "portal_entity_relationships", []);
    queue(s, "customer_credentials", [credential]);
    await expect(
      customerLinkReviewRouter.createCaller(customerCtx()).request({
        ...requestInput(),
        businessEntityId: 999,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(s.selects).not.toContain("customers");
    expect(s.writes).toEqual([]);
  });

  it("uses the dedicated customer actor even when an employee admin session is concurrently present", async () => {
    requestScope(s);
    queue(s, "customer_credentials", [credential]);
    queue(s, "customer_link_requests", []);
    queue(s, "customer_verified_links", []);

    await expect(
      customerLinkReviewRouter
        .createCaller(customerCtx({ user: { id: 501, role: "admin" } }))
        .request(requestInput())
    ).resolves.toMatchObject({ status: "pending" });
    await expect(
      customerLinkReviewRouter
        .createCaller(customerCtx({ user: { id: 501, role: "admin" } }))
        .adminList({ businessEntityId: 4 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("approves only after fresh dual contact proof and updates the existing relationship/profile, not permissions", async () => {
    reviewRows(s);
    const result = await customerLinkReviewRouter
      .createCaller(adminCtx())
      .review({
        requestId: 77,
        decision: "approve",
        reviewNote: "تمت مطابقة الهوية والعقد وسجل الاتصال حضورياً.",
        evidenceReference: "ID-2024",
        identityCheckMethod: "in_person_id",
        identityConfirmed: true,
      });

    expect(result).toEqual({ id: 77, status: "approved" });
    expect(s.locks).toContain("customer_credentials");
    expect(s.locks).toContain("customer_link_requests");
    expect(s.locks).toContain("customers");
    expect(s.locks).toContain("portal_profiles");
    expect(
      s.writes.find(w => w.table === "customer_verified_links")?.values
    ).toMatchObject({
      credentialId: actor.credentialId,
      customerId: target.id,
      requestId: 77,
      approvedBy: 501,
    });
    const relationshipUpdate = s.writes.find(
      w => w.table === "portal_entity_relationships" && w.action === "update"
    );
    expect(relationshipUpdate?.values).toEqual({ sourceProfileId: target.id });
    const profileUpdate = s.writes.find(
      w => w.table === "portal_profiles" && w.action === "update"
    );
    expect(profileUpdate?.values).toEqual({ localRecordId: target.id });
    expect(s.writes.some(w => w.table === "customers")).toBe(false);
  });

  it("rejects approval when MFA is absent before opening a mutation transaction", async () => {
    vi.mocked(hasActiveMfa).mockResolvedValue(false);
    await expect(
      customerLinkReviewRouter.createCaller(adminCtx()).review({
        requestId: 77,
        decision: "approve",
        reviewNote: "تمت مراجعة الهوية والاتصال وفق الإجراء الداخلي.",
        evidenceReference: "ID-2024",
        identityCheckMethod: "in_person_id",
        identityConfirmed: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(s.transactions).toBe(0);
    expect(s.writes).toEqual([]);
  });

  it("rejects stale proof and changed contacts without mutating link, relationship, or profile", async () => {
    reviewRows(s, {
      credential: {
        ...credential,
        emailVerifiedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        phoneVerifiedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });
    await expect(
      customerLinkReviewRouter.createCaller(adminCtx()).review({
        requestId: 77,
        decision: "approve",
        reviewNote: "تم فحص المرفقات والتأكد من بيانات الطلب يدوياً.",
        evidenceReference: "ID-2024",
        identityCheckMethod: "in_person_id",
        identityConfirmed: true,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);

    s = state();
    db = new FakeDb(s);
    vi.mocked(getDb).mockResolvedValue(db as any);
    reviewRows(s, {
      credential: { ...credential, email: "changed@example.invalid" },
    });
    await expect(
      customerLinkReviewRouter.createCaller(adminCtx()).review({
        requestId: 77,
        decision: "approve",
        reviewNote: "تم فحص المرفقات والتأكد من بيانات الطلب يدوياً.",
        evidenceReference: "ID-2024",
        identityCheckMethod: "in_person_id",
        identityConfirmed: true,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);
  });

  it("rejects a target already owned by another portal profile and never overrides suspended ownership", async () => {
    reviewRows(s);
    queue(s, "portal_profiles", [activeProfile], [{ id: 999, userId: 66 }]);
    await expect(
      customerLinkReviewRouter.createCaller(adminCtx()).review({
        requestId: 77,
        decision: "approve",
        reviewNote: "تم فحص المرفقات والتأكد من بيانات الطلب يدوياً.",
        evidenceReference: "ID-2024",
        identityCheckMethod: "existing_contract_identity",
        identityConfirmed: true,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);
  });
  it("requires dual database proof and does not use untrusted customer flags", async () => {
    requestScope(s);
    queue(s, "customer_credentials", [{ ...credential, phoneVerifiedAt: null }]);
    await expect(customerLinkReviewRouter.createCaller(customerCtx({ customer: { ...actor, emailVerified: true, phoneVerified: true } })).request(requestInput())).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(s.writes).toEqual([]);
    expect(s.selects).not.toContain("customers");
  });
  it("rejects a unique verified ownership conflict without touching profiles or relationships", async () => {
    reviewRows(s);
    queue(s, "customer_verified_links", [{ id: 91 }], []);
    await expect(customerLinkReviewRouter.createCaller(adminCtx()).review({ requestId: 77, decision: "approve", reviewNote: "تمت مراجعة الدليل والاتصال بمقدم الطلب", evidenceReference: "EVIDENCE-91", identityCheckMethod: "in_person_id", identityConfirmed: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.writes).toEqual([]);
  });
  it("blocks a forged cross-site admin approval before any DB mutation", async () => {
    await expect(customerLinkReviewRouter.createCaller(adminCtx({ req: { headers: { origin: "https://attacker.invalid", host: "rasd.invalid" } } })).review({ requestId: 77, decision: "approve", reviewNote: "تمت مراجعة الدليل والاتصال بمقدم الطلب", evidenceReference: "EVIDENCE-91", identityCheckMethod: "in_person_id", identityConfirmed: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(s.transactions).toBe(0);
  });

});

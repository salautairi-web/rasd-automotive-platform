import { describe, expect, it } from "vitest";
import { canApproveExport, exportExpires, isReadOnlyWorkspace, isWorkspaceActive, sameEntityScope } from "../shared/externalAuditor50";

describe("external auditor workspace", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2026-02-01T00:00:00Z");
  it("allows only read-only workspace actions", () => {
    expect(isReadOnlyWorkspace("external_auditor_read_only", "view")).toBe(true);
    expect(isReadOnlyWorkspace("external_auditor_read_only", "delete")).toBe(false);
  });
  it("enforces entity scope and expiry", () => {
    expect(sameEntityScope(1, 1)).toBe(true);
    expect(sameEntityScope(1, 2)).toBe(false);
    expect(isWorkspaceActive("active", start, end, new Date("2026-01-10T00:00:00Z"))).toBe(true);
    expect(isWorkspaceActive("active", start, end, new Date("2026-03-10T00:00:00Z"))).toBe(false);
    expect(exportExpires(end, new Date("2026-02-01T00:00:00Z"))).toBe(true);
  });
  it("requires separate approval and redaction completion", () => {
    expect(canApproveExport(10, 11, "completed")).toBe(true);
    expect(canApproveExport(10, 10, "completed")).toBe(false);
    expect(canApproveExport(10, 11, "pending")).toBe(false);
  });
});

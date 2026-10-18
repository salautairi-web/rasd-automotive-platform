import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("administrative entity-scoped procedure", () => {
  it("requires the admin procedure and a positive entity identifier", () => {
    const source = readFileSync(
      new URL("./adminEntityScopedProcedure.ts", import.meta.url),
      "utf8"
    );
    expect(source).toContain("adminProcedure");
    expect(source).toContain("businessEntityId: z.number().int().positive()");
    expect(source).toContain('code: "BAD_REQUEST"');
  });

  it("is applied to entity-specific early-warning operations", () => {
    const source = readFileSync(
      new URL("./alerts.ts", import.meta.url),
      "utf8"
    );
    for (const procedure of [
      "dashboard",
      "list",
      "detect",
      "transition",
      "escalate",
      "feedback",
    ]) {
      expect(source).toMatch(
        new RegExp(`${procedure}:\\s*adminEntityScopedProcedure\\s*\\.input`)
      );
    }
    expect(source).toMatch(/rules:\s*adminProcedure\s*\.input/);
    expect(source).toMatch(/savePreference:\s*adminProcedure\s*\.input/);
  });

  it("defines a CI performance gate with explicit bundle and load limits", () => {
    const packageSource = readFileSync(
      new URL("../package.json", import.meta.url),
      "utf8"
    );
    const gateSource = readFileSync(
      new URL("../scripts/check-performance.mjs", import.meta.url),
      "utf8"
    );
    expect(packageSource).toContain(
      '"test:performance": "RASD_PERF_REPORT=performance-report.json node scripts/check-performance.mjs"'
    );
    expect(packageSource).toContain('"record:performance": "node scripts/record-performance-history.mjs"');
    expect(gateSource).toContain("maxTotalBytes");
    expect(gateSource).toContain("maxLargestBytes");
    expect(gateSource).toContain("maxFirstLoadMs");
  });
});

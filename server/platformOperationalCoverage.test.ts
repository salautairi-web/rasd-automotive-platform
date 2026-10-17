import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const routersSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");

const operationalRoutes = [
  "/sales", "/rental", "/workshop", "/parts", "/inventory", "/fleet",
  "/finance", "/treasury", "/crm", "/procurement", "/documents/dms",
  "/workflow/engine", "/projects/pmo", "/hr/payroll", "/trade/international",
  "/assets", "/compliance", "/audit-assurance", "/customer-portal",
];

const protectedEntityRouters = [
  "crm.ts", "documents.ts", "inventory.ts", "ar65.ts", "hr63.ts", "projects62.ts",
];

describe("RASD operational coverage contracts", () => {
  it("keeps every core operational surface mapped to a real page", () => {
    for (const route of operationalRoutes) expect(appSource).toContain(`path=\"${route}\"`);
    expect(appSource).not.toContain("ModulePlaceholder");
  });

  it("keeps the central router wired to the protected module routers", () => {
    for (const namespace of ["sales:", "rental:", "workshop:", "inventory:", "crm:", "documents:", "projects:"]) {
      expect(routersSource).toContain(namespace);
    }
  });

  it("requires the reusable entity boundary in high-risk specialized routers", () => {
    for (const file of protectedEntityRouters) {
      const source = readFileSync(resolve(root, "server", file), "utf8");
      expect(source, file).toContain("entityScopedProcedure");
      expect(source, file).not.toMatch(/protectedProcedure\s*\.input/);
    }
  });
});

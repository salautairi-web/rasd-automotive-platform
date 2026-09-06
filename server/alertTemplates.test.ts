import { describe, expect, it } from "vitest";
import { earlyWarningTemplates } from "../shared/alertTemplates";

describe("early warning templates", () => {
  it("covers the required operational domains", () => {
    const domains = new Set(earlyWarningTemplates.map(template => template.domain));
    expect(domains).toEqual(new Set(["rental", "workshop", "parts", "sales", "import_export", "treasury", "project", "compliance", "security"]));
  });
  it("gives every template an owning action and unique key", () => {
    const keys = earlyWarningTemplates.map(template => template.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(earlyWarningTemplates.every(template => template.action.length > 0 && template.metric.length > 0)).toBe(true);
  });
});

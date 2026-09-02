import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertSameEntity } from "../server/entityAccess";

describe("entity scope invariants", () => {
  it("accepts records from the same business entity", () => {
    expect(assertSameEntity(10, 10)).toBe(true);
  });

  it("rejects records from different business entities even with matching names", () => {
    expect(() => assertSameEntity(10, 20)).toThrow(TRPCError);
  });

  it("rejects missing entity ownership", () => {
    expect(() => assertSameEntity(undefined, 10)).toThrow(TRPCError);
    expect(() => assertSameEntity(10, null)).toThrow(TRPCError);
  });
});

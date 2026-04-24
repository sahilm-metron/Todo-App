import { describe, expect, it } from "vitest";
import { coerceStringList } from "./common.helper";

describe("coerceStringList", () => {
  it("returns one tag when input is a single string", () => {
    expect(coerceStringList("frontend")).toEqual(["frontend"]);
    expect(coerceStringList("  deep-work  ")).toEqual(["deep-work"]);
  });

  it("returns empty array for empty or whitespace string", () => {
    expect(coerceStringList("")).toEqual([]);
    expect(coerceStringList("   ")).toEqual([]);
  });

  it("filters and trims string array entries", () => {
    expect(coerceStringList(["  a ", "", "b", 123] as unknown[])).toEqual(["a", "b"]);
  });

  it("returns empty array for nullish or non-array non-string", () => {
    expect(coerceStringList(null)).toEqual([]);
    expect(coerceStringList(undefined)).toEqual([]);
    expect(coerceStringList(42)).toEqual([]);
    expect(coerceStringList({})).toEqual([]);
  });
});

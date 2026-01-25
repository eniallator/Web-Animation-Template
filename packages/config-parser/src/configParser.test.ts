import { beforeEach, describe, expect, it, vi } from "vitest";

import { ParamConfig } from "./configParser.ts";
import { contentParser, createParsers, valueParser } from "./create.ts";

import type { InitParserObject } from "./types.ts";

const makeParsers = () =>
  createParsers({
    foo: valueParser(
      () => ({
        html: vi.fn(() => document.createElement("input")),
        getValue: vi.fn(() => "parsed"),
        updateValue: vi.fn(),
        serialise: vi.fn(() => "serialised"),
      }),
      "Foo",
      "Foo Title"
    ),
    bar: contentParser(
      () => () => document.createElement("button"),
      "Bar",
      "Bar Title"
    ),
  });

type TestParserValues =
  ReturnType<typeof makeParsers> extends InitParserObject<infer T> ? T : never;

describe("ParamConfig", () => {
  let baseEl: HTMLElement;
  let paramConfig: ParamConfig<TestParserValues>;

  beforeEach(() => {
    baseEl = document.createElement("div");
    paramConfig = new ParamConfig(makeParsers(), baseEl, {
      query: location.search,
    });
  });

  // --- getAllValues ---
  it("getAllValues returns all values", () => {
    expect(paramConfig.getAllValues()).toEqual({
      foo: "parsed",
      bar: null,
    });
  });

  // --- getValue ---
  it("getValue returns the value for a key", () => {
    expect(paramConfig.getValue("foo")).toBe("parsed");
    expect(paramConfig.getValue("bar")).toBe(null);
  });

  // --- setValue ---
  it("setValue updates the value and calls updateValue if type is 'Value'", () => {
    paramConfig.setValue("foo", "newVal");
    expect(paramConfig.getValue("foo")).toBe("newVal");

    paramConfig.setValue("bar", "test");
    expect(paramConfig.getValue("bar")).toBe(null);
  });

  // --- extra getter ---
  it("extra returns undefined if not set", () => {
    expect(paramConfig.extra).toBeUndefined();
  });

  // --- addListener & tellListeners ---
  it("addListener and tellListeners notify listeners", () => {
    const cb = vi.fn();
    paramConfig.addListener(cb);
    paramConfig.tellListeners("foo");
    expect(cb).toHaveBeenCalledWith(paramConfig.getAllValues(), "foo");
  });

  it("addListener with empty subscriptions notifies on any update", () => {
    const cb = vi.fn();

    paramConfig.addListener(cb, []);
    paramConfig.tellListeners("foo");
    expect(cb).toHaveBeenCalled();

    cb.mockClear();
    paramConfig.tellListeners("bar");
    expect(cb).toHaveBeenCalled();
  });

  it("tellListeners only notifies listeners subscribed to the id", () => {
    const cb = vi.fn();
    paramConfig.addListener(cb, ["foo"]);
    paramConfig.tellListeners("bar");
    expect(cb).not.toHaveBeenCalled();

    paramConfig.tellListeners("foo");
    expect(cb).toHaveBeenCalled();
  });

  // --- serialiseToUrlParams ---
  it("serialiseToUrlParams returns correct string", () => {
    const result = paramConfig.serialiseToUrlParams("extraVal");
    expect(result).toBe("foo=serialised&extra=extraVal");
  });

  it("serialiseToUrlParams handles no extra", () => {
    expect(paramConfig.serialiseToUrlParams()).toBe("foo=serialised");
  });
});

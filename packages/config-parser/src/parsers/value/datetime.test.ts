import { describe, expect, it, vi } from "vitest";

import { datetimeParser } from "./datetime.ts";
import { formatDate } from "@web-art/core";

describe("datetimeParser", () => {
  const valueA = "2023-03-07T08:09:10";
  const valueAShort = "Ya7Hfxw";
  const valueB = "2024-03-07T08:09:10";

  it("creates the input with given attributes and default value", () => {
    const parser = datetimeParser({
      default: new Date(valueA),
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false);
    expect(el.tagName).toBe("INPUT");
    expect(el.getAttribute("value")).toBe(valueA);
    expect(el.getAttribute("id")).toBe("id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      (
        datetimeParser({ default: new Date(valueB) })
          .methods(vi.fn(), vi.fn(), {
            initial: new Date(valueB),
            default: new Date(valueB),
          })
          .html(null, valueA, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}.000`);

    expect(
      (
        datetimeParser({ default: new Date(valueB) })
          .methods(vi.fn(), vi.fn(), {
            initial: new Date(valueA),
            default: new Date(valueB),
          })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}.000`);

    expect(
      (
        datetimeParser({ default: new Date(valueB) })
          .methods(vi.fn(), vi.fn(), {
            initial: null,
            default: new Date(valueA),
          })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}.000`);

    expect(
      (
        datetimeParser({ default: new Date(valueA) })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}.000`);

    expect(
      (
        datetimeParser({})
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(formatDate(new Date(0)).slice(0, -3));
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = datetimeParser({}).methods(
      vi.fn(),
      vi.fn(() => new Date(valueA))
    );

    expect(parser.serialise(true)).toBe(valueAShort);
    expect(parser.serialise(false)).toBe(`${valueA}.000Z`);
  });

  it("html deserialises shortUrl properly", () => {
    const parser = datetimeParser({}).methods(vi.fn(), vi.fn());

    expect(parser.html(null, valueAShort, true).getAttribute("value")).toBe(
      valueA
    );
    expect(parser.html(null, valueA, false).getAttribute("value")).toBe(valueA);
  });

  it("serialise returns null if value matches default", () => {
    const parser = datetimeParser({ default: new Date(valueA) }).methods(
      vi.fn(),
      vi.fn(() => new Date(valueA))
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets the value", () => {
    const parser = datetimeParser({}).methods(
      vi.fn(),
      vi.fn(() => new Date(valueA))
    );
    const el = document.createElement("input");

    parser.updateValue(el, false);
    expect(el.value).toBe(valueA);
  });

  it("getValue returns expected value", () => {
    const parser = datetimeParser({}).methods(vi.fn(), vi.fn());
    const el = document.createElement("input");

    el.value = valueA;
    expect(parser.getValue(el)).toStrictEqual(new Date(valueA));
  });

  it("html sets up onchange handler", () => {
    const onChange = vi.fn();
    const parser = datetimeParser({}).methods(onChange, vi.fn());

    const el = parser.html(null, null, false) as HTMLInputElement;
    el.value = valueA;
    el.onchange?.({} as Event);

    expect(onChange).toHaveBeenCalledWith(new Date(valueA));
  });
});

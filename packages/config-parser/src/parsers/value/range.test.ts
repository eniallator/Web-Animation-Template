import { describe, expect, it, vi } from "vitest";

import { rangeParser } from "./range.ts";

describe("rangeParser", () => {
  const valueA = 10;
  const valueAShort = valueA;
  const valueB = 20;

  it("creates the input with given attributes and default value", () => {
    const parser = rangeParser({
      default: valueA,
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false);
    expect(el.tagName).toBe("INPUT");
    expect(el.getAttribute("value")).toBe(`${valueA}`);
    expect(el.getAttribute("id")).toBe("id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      (
        rangeParser({ default: valueB })
          .methods(vi.fn(), vi.fn(), { initial: valueB, default: valueB })
          .html(null, `${valueA}`, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}`);

    expect(
      (
        rangeParser({ default: valueB })
          .methods(vi.fn(), vi.fn(), { initial: valueA, default: valueB })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}`);

    expect(
      (
        rangeParser({ default: valueB })
          .methods(vi.fn(), vi.fn(), { initial: null, default: valueA })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}`);

    expect(
      (
        rangeParser({ default: valueA })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(`${valueA}`);

    expect(
      (
        rangeParser({})
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("100");
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = rangeParser({}).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );

    expect(parser.serialise(true)).toBe(`${valueAShort}`);
    expect(parser.serialise(false)).toBe(`${valueA}`);
  });

  it("html deserialises shortUrl properly", () => {
    const parser = rangeParser({}).methods(vi.fn(), vi.fn());

    expect(
      parser.html(null, `${valueAShort}`, true).getAttribute("value")
    ).toBe(`${valueA}`);
    expect(parser.html(null, `${valueA}`, false).getAttribute("value")).toBe(
      `${valueA}`
    );
  });

  it("serialise returns null if value matches default", () => {
    const parser = rangeParser({ default: valueA }).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets the value", () => {
    const parser = rangeParser({}).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );
    const el = document.createElement("input");

    parser.updateValue(el, false);
    expect(el.value).toBe(`${valueA}`);
  });

  it("getValue returns expected value", () => {
    const parser = rangeParser({}).methods(vi.fn(), vi.fn());
    const el = document.createElement("input");

    el.value = `${valueA}`;
    expect(parser.getValue(el)).toStrictEqual(valueA);
  });

  it("html sets up onchange handler", () => {
    const onChange = vi.fn();
    const parser = rangeParser({}).methods(onChange, vi.fn());

    const el = parser.html(null, null, false) as HTMLInputElement;
    el.value = `${valueA}`;
    el.onchange?.({} as Event);

    expect(onChange).toHaveBeenCalledWith(valueA);
  });
});

import { tuple } from "@web-art/core";
import { describe, expect, it, vi } from "vitest";

import { selectParser } from "./select.ts";

describe("selectParser", () => {
  const options = tuple("Hello", "World!", "Foo Bar", "Test");
  const valueA = "Foo Bar" as const;
  const valueAShort = valueA;
  const valueB = "Test" as const;

  it("creates the input with given attributes and default value", () => {
    const parser = selectParser({
      default: valueA,
      options,
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false) as HTMLSelectElement;
    expect(el.tagName).toBe("SELECT");
    expect(el.value).toBe(valueA);
    expect(el.getAttribute("id")).toBe("id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      (
        selectParser({ default: valueB, options })
          .methods(vi.fn(), vi.fn(), { initial: valueB, default: valueB })
          .html(null, valueA, false) as HTMLInputElement
      ).value
    ).toBe(valueA);

    expect(
      (
        selectParser({ default: valueB, options })
          .methods(vi.fn(), vi.fn(), { initial: valueA, default: valueB })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(valueA);

    expect(
      (
        selectParser({ default: valueB, options })
          .methods(vi.fn(), vi.fn(), { initial: null, default: valueA })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(valueA);

    expect(
      (
        selectParser({ default: valueA, options })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe(valueA);

    expect(
      (
        selectParser({ options })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("Hello");
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = selectParser({ options }).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );

    expect(parser.serialise(true)).toBe(valueAShort);
    expect(parser.serialise(false)).toBe(valueA);
  });

  it("html deserialises shortUrl properly", () => {
    const parser = selectParser({ options }).methods(vi.fn(), vi.fn());

    expect(
      (parser.html(null, valueAShort, true) as HTMLSelectElement).value
    ).toBe(valueA);
    expect((parser.html(null, valueA, false) as HTMLSelectElement).value).toBe(
      valueA
    );
  });

  it("serialise returns null if value matches default", () => {
    const parser = selectParser({ default: valueA, options }).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets the value", () => {
    const parser = selectParser({ options }).methods(
      vi.fn(),
      vi.fn(() => valueA)
    );
    const el = document.createElement("input");

    parser.updateValue(el, false);
    expect(el.value).toBe(valueA);
  });

  it("getValue returns expected value", () => {
    const parser = selectParser({ options }).methods(vi.fn(), vi.fn());
    const el = document.createElement("input");

    el.value = valueA;
    expect(parser.getValue(el)).toStrictEqual(valueA);
  });

  it("html sets up onchange handler", () => {
    const onChange = vi.fn();
    const parser = selectParser({ options }).methods(onChange, vi.fn());

    const el = parser.html(null, null, false) as HTMLInputElement;
    el.value = valueA;
    el.onchange?.({} as Event);

    expect(onChange).toHaveBeenCalledWith(valueA);
  });
});

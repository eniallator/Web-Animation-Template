import { describe, expect, it, vi } from "vitest";

import { checkboxParser } from "./checkbox.ts";

describe("checkboxParser", () => {
  it("creates the input with given attributes and default checked state", () => {
    const parser = checkboxParser({
      default: true,
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false);
    expect(el.tagName).toBe("INPUT");
    expect(el.hasAttribute("checked")).toBe(true);
    expect(el.getAttribute("id")).toBe("id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      (
        checkboxParser({ default: false })
          .methods(vi.fn(), vi.fn(), { initial: false, default: false })
          .html(null, "true", false) as HTMLInputElement
      ).checked
    ).toBeTruthy();

    expect(
      (
        checkboxParser({ default: false })
          .methods(vi.fn(), vi.fn(), { initial: true, default: false })
          .html(null, null, false) as HTMLInputElement
      ).checked
    ).toBeTruthy();

    expect(
      (
        checkboxParser({ default: false })
          .methods(vi.fn(), vi.fn(), { initial: null, default: true })
          .html(null, null, false) as HTMLInputElement
      ).checked
    ).toBeTruthy();

    expect(
      (
        checkboxParser({ default: true })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).checked
    ).toBeTruthy();

    expect(
      (
        checkboxParser({})
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).checked
    ).toBeFalsy();
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = checkboxParser({}).methods(
      vi.fn(),
      vi.fn(() => true)
    );

    expect(parser.serialise(true)).toBe("1");
    expect(parser.serialise(false)).toBe("true");
  });

  it("html uses query to set initial checked state", () => {
    const parser = checkboxParser({ default: false }).methods(
      vi.fn(),
      vi.fn(() => false)
    );

    expect(parser.html(null, "1", true).hasAttribute("checked")).toBe(true);
    expect(parser.html(null, "true", false).hasAttribute("checked")).toBe(true);
  });

  it("serialise returns null if value matches default", () => {
    const parser = checkboxParser({ default: true }).methods(
      vi.fn(),
      vi.fn(() => true)
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets or removes checked attribute", () => {
    let externalValue: boolean;
    const parser = checkboxParser({}).methods(
      vi.fn(),
      vi.fn(() => externalValue)
    );
    const el = document.createElement("input");

    externalValue = true;
    parser.updateValue(el, false);
    expect(el.hasAttribute("checked")).toBe(true);

    externalValue = false;
    parser.updateValue(el, false);
    expect(el.hasAttribute("checked")).toBe(false);
  });

  it("getValue returns true if checked attribute is present", () => {
    const parser = checkboxParser({}).methods(vi.fn(), vi.fn());
    const el = document.createElement("input");

    el.setAttribute("checked", "");
    expect(parser.getValue(el)).toBe(true);

    el.removeAttribute("checked");
    expect(parser.getValue(el)).toBe(false);
  });

  it("html sets up onchange handler", () => {
    const onChange = vi.fn();
    const parser = checkboxParser({}).methods(onChange, vi.fn());

    const el = parser.html(null, null, false) as HTMLInputElement;
    el.checked = true;
    el.onchange?.({} as Event);

    expect(onChange).toHaveBeenCalledWith(true);
  });
});

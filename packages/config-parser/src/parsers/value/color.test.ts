import { describe, expect, it, vi } from "vitest";

import { colorParser } from "./color.ts";

describe("colorParser", () => {
  it("creates a color input with given attributes and default value", () => {
    const parser = colorParser({
      default: "ff0000",
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false);
    expect(el.tagName).toBe("INPUT");
    expect(el.getAttribute("value")).toBe("#ff0000");
    expect(el.getAttribute("id")).toBe("id");
    expect(el.getAttribute("data-hello")).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      (
        colorParser({ default: "000000" })
          .methods(vi.fn(), vi.fn(), { initial: "000000", default: "000000" })
          .html(null, "ff0000", false) as HTMLInputElement
      ).value
    ).toBe("#ff0000");

    expect(
      (
        colorParser({ default: "000000" })
          .methods(vi.fn(), vi.fn(), { initial: "ff0000", default: "000000" })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("#ff0000");

    expect(
      (
        colorParser({ default: "000000" })
          .methods(vi.fn(), vi.fn(), { initial: null, default: "ff0000" })
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("#ff0000");

    expect(
      (
        colorParser({ default: "ff0000" })
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("#ff0000");

    expect(
      (
        colorParser({})
          .methods(vi.fn(), vi.fn())
          .html(null, null, false) as HTMLInputElement
      ).value
    ).toBe("#000000");
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = colorParser({}).methods(
      vi.fn(),
      vi.fn(() => "ff0000")
    );

    expect(parser.serialise(true)).toBe("/wAA");
    expect(parser.serialise(false)).toBe("ff0000");
  });

  it("html deserialises shortUrl properly", () => {
    const parser = colorParser({}).methods(vi.fn(), vi.fn());

    expect(parser.html(null, "/wAA", true).getAttribute("value")).toBe(
      "#ff0000"
    );
    expect(parser.html(null, "ff0000", false).getAttribute("value")).toBe(
      "#ff0000"
    );
  });

  it("serialise returns null if value matches default", () => {
    const parser = colorParser({ default: "ff0000" }).methods(
      vi.fn(),
      vi.fn(() => "ff0000")
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets the value", () => {
    const parser = colorParser({}).methods(
      vi.fn(),
      vi.fn(() => "ff0000")
    );
    const el = document.createElement("input");

    parser.updateValue(el, false);
    expect(el.value).toBe("#ff0000");
  });

  it("getValue returns expected value", () => {
    const parser = colorParser({}).methods(vi.fn(), vi.fn());
    const el = document.createElement("input");

    el.value = "#ff0000";
    expect(parser.getValue(el)).toBe("ff0000");
  });

  it("html sets up onchange handler", () => {
    const onChange = vi.fn();
    const parser = colorParser({}).methods(onChange, vi.fn());

    const el = parser.html(null, null, false) as HTMLInputElement;
    el.value = "#ff0000";
    el.oninput?.({} as Event);

    expect(onChange).toHaveBeenCalledWith("ff0000");
  });
});

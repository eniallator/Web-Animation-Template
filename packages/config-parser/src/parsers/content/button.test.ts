import { describe, expect, it, vi } from "vitest";

import { buttonParser } from "./button";

describe("buttonParser", () => {
  it("creates a button with correct text and attributes", () => {
    const parser = buttonParser({
      text: "Click me",
      attrs: { class: "my-btn", "data-hello": "world!" },
    });
    const el = parser.methods(vi.fn(), vi.fn()).html("btn-id");

    expect(el.tagName).toBe("BUTTON");
    expect(el.textContent).toBe("Click me");
    expect(el.getAttribute("class")).toBe("primary wrap-text my-btn");
    expect(el.getAttribute("id")).toBe("btn-id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("calls onChange when clicked", () => {
    const parser = buttonParser({});
    const onChange = vi.fn();
    const el = parser.methods(onChange, vi.fn()).html("id");

    el.click();

    expect(onChange).toHaveBeenCalled();
  });

  it("should have defaults with an empty object", () => {
    const parser = buttonParser({});
    const el = parser.methods(vi.fn(), vi.fn()).html(null);

    expect(el.tagName).toBe("BUTTON");
    expect(el.textContent).toBe("");
    expect(el.getAttribute("class")).toBe("primary wrap-text");
    expect(el.hasAttribute("id")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { dom } from "./dom";

describe("dom.addListener", () => {
  it("should add an event listener and call it", () => {
    const button = document.createElement("button");
    let called = false;
    dom.addListener(button, "click", () => {
      called = true;
    });
    button.click();
    expect(called).toBe(true);
  });

  it("should not throw if adding to a valid element", () => {
    const div = document.createElement("div");
    expect(() => {
      dom.addListener(div, "mouseenter", () => {
        // Do things
      });
    }).not.toThrow();
  });
});

describe("dom.get", () => {
  it("should return the element if it exists", () => {
    const baseEl = document.createElement("div");
    const div = document.createElement("div");
    baseEl.appendChild(div);
    div.id = "test";
    const el = dom.get<HTMLDivElement>("#test", baseEl);
    expect(el).toBe(div);
  });

  it("should throw if the element does not exist", () => {
    const baseEl = document.createElement("div");
    expect(() => dom.get<HTMLDivElement>("#does-not-exist", baseEl)).toThrow(
      "Could not find element"
    );
  });
});

describe("dom.toAttrs", () => {
  it("should convert attributes to string", () => {
    expect(dom.toAttrs({ id: "foo", class: "bar" })).toBe(
      'id="foo" class="bar"'
    );
  });

  it("should include key only if value is null", () => {
    expect(dom.toAttrs({ disabled: null, id: "foo" })).toBe(
      'disabled id="foo"'
    );
  });

  it("should return empty string for empty object", () => {
    expect(dom.toAttrs({})).toBe("");
  });
});

describe("dom.toHtml", () => {
  it("should create an element from a valid tag string", () => {
    const el = dom.toHtml("<div>hello</div>");
    expect(el instanceof HTMLDivElement).toBe(true);
    expect(el.textContent).toBe("hello");
  });

  it("should create an element from a known tag", () => {
    const el = dom.toHtml("<button>Click</button>");
    expect(el instanceof HTMLButtonElement).toBe(true);
    expect(el.textContent).toBe("Click");
  });

  it("should throw if no nodes found", () => {
    expect(() => dom.toHtml("")).toThrow("No nodes found");
    expect(() => dom.toHtml("   ")).toThrow("No nodes found");
  });

  it("should fallback to HTMLElement for unknown tags", () => {
    const el = dom.toHtml("<custom-elem></custom-elem>");
    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe("custom-elem");
  });
});

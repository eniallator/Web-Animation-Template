import { tuple } from "@web-art/core";
import { describe, expect, it, vi } from "vitest";

import { numberParser, checkboxParser, textParser } from "./value";
import { collectionParser } from "./collection.ts";

describe("collectionParser", () => {
  const fields = tuple(
    checkboxParser({ attrs: { field: null } }),
    textParser({}),
    numberParser({})
  );
  const getCollectionValue = (collectionEl: HTMLElement) =>
    [...collectionEl.querySelectorAll("tbody tr").values()].map(row => [
      (row.querySelector('input[type="checkbox"][field]') as HTMLInputElement)
        .checked,
      (row.querySelector('input[type="text"]') as HTMLInputElement).value,
      Number(
        (row.querySelector('input[type="number"]') as HTMLInputElement).value
      ),
    ]);

  const valueA: [boolean, string, number] = [true, "Foo, Bar, Baz\\", 10];
  const valueASerialised = String.raw`true,Foo\, Bar\, Baz\\,10`;
  const valueAShort = String.raw`1,Foo\, Bar\, Baz\\,10`;
  const valueB: [boolean, string, number] = [false, "Test", 20];

  it("creates the input with given attributes and default value", () => {
    const parser = collectionParser({
      default: [valueA],
      fields,
      attrs: { "data-hello": "world!" },
    }).methods(vi.fn(), vi.fn());

    const el = parser.html("id", null, false);

    expect(el.tagName).toBe("DIV");
    expect(getCollectionValue(el)).toStrictEqual([valueA]);
    expect(el.getAttribute("id")).toBe("id");
    expect(el.dataset.hello).toBe("world!");
  });

  it("initial state is expected", () => {
    expect(
      getCollectionValue(
        collectionParser({ fields, default: [valueB] })
          .methods(vi.fn(), vi.fn())
          .html("id", valueASerialised, false)
      )
    ).toStrictEqual([valueA]);

    expect(
      getCollectionValue(
        collectionParser({ fields, default: [valueA] })
          .methods(vi.fn(), vi.fn())
          .html("id", null, false)
      )
    ).toStrictEqual([valueA]);

    expect(
      collectionParser({ fields, default: [valueA] })
        .methods(vi.fn(), vi.fn())
        .html("id", null, false)
        .querySelector(".collection-actions")
    ).toBeNull();

    expect(
      getCollectionValue(
        collectionParser({ fields, default: [], expandable: true })
          .methods(vi.fn(), vi.fn())
          .html("id", valueASerialised, false)
      )
    ).toStrictEqual([valueA]);

    expect(
      collectionParser({ fields, default: [], expandable: true })
        .methods(vi.fn(), vi.fn())
        .html("id", null, false)
        .querySelector(".collection-actions")
    ).not.toBeNull();
  });

  it("expandable collections let you add rows", () => {
    const el = collectionParser({ fields, default: [valueA], expandable: true })
      .methods(vi.fn(), vi.fn())
      .html("id", null, false);

    (el.querySelector("button[data-action=add]") as HTMLButtonElement).click();

    expect(getCollectionValue(el)).toStrictEqual([valueA, [false, "", 0]]);
  });

  it("expandable collections let you delete rows", () => {
    const el = collectionParser({ fields, default: [valueA], expandable: true })
      .methods(
        vi.fn(),
        vi.fn(() => [valueA])
      )
      .html("id", null, false);

    (
      el.querySelector("tbody input[data-row-selector]") as HTMLInputElement
    ).checked = true;

    (
      el.querySelector("button[data-action=delete]") as HTMLButtonElement
    ).click();

    expect(getCollectionValue(el)).toStrictEqual([]);
  });

  it("serialise returns correct value for shortUrl", () => {
    const parser = collectionParser({ fields, default: [valueB] }).methods(
      vi.fn(),
      vi.fn(() => [valueA])
    );

    parser.html("id", null, false);

    expect(parser.serialise(true)).toBe(valueAShort);
    expect(parser.serialise(false)).toBe(valueASerialised);
  });

  it("html deserialises shortUrl properly", () => {
    const parser = collectionParser({ fields, default: [valueB] }).methods(
      vi.fn(),
      vi.fn()
    );

    expect(
      getCollectionValue(parser.html("id", valueAShort, true))
    ).toStrictEqual([valueA]);
    expect(
      getCollectionValue(parser.html("id", valueASerialised, false))
    ).toStrictEqual([valueA]);
  });

  it("serialise returns null if value matches default", () => {
    const parser = collectionParser({ fields, default: [valueA] }).methods(
      vi.fn(),
      vi.fn(() => [valueA])
    );

    expect(parser.serialise(false)).toBe(null);
  });

  it("updateValue sets the value", () => {
    const parser = collectionParser({ fields, default: [valueB] }).methods(
      vi.fn(),
      vi.fn(() => [valueA])
    );
    const el = parser.html("id", null, false);

    parser.updateValue(el, false);
    expect(getCollectionValue(el)).toStrictEqual([valueA]);
  });
});

import { dom, filterAndMap, raise } from "@web-art/core";
import { stringToHTML } from "../helpers.js";
import {
  ConfigCollection,
  InputConfig,
  Parser,
  DefaultType,
  TupledStateType,
} from "../types.js";
import { inputParser } from "./input.js";
import { isExact } from "deep-guards";

const getRowValues = <const F extends readonly [InputConfig, ...InputConfig[]]>(
  baseEl: HTMLElement,
  parsers: { [K in keyof F]: Parser<DefaultType<F[K]>> },
  expandable: boolean
): readonly TupledStateType<F>[] => {
  const container = dom.get("tbody", baseEl);
  return [...container.querySelectorAll("tr")].map(el => {
    const itemEls = [...el.children] as HTMLElement[];
    return parsers.map((parser, i) =>
      "getValue" in parser
        ? parser.getValue(
            itemEls[i + (expandable ? 1 : 0)] ??
              raise(
                new Error(
                  "Did not find an item element when getting a collections values"
                )
              )
          )
        : null
    ) as TupledStateType<F>;
  });
};

const newRow = <const F extends readonly [InputConfig, ...InputConfig[]]>(
  baseEl: HTMLElement,
  onChange: ((value: readonly TupledStateType<F>[]) => void) | null,
  parsers: { [K in keyof F]: Parser<DefaultType<F[K]>> },
  values: TupledStateType<F> | null,
  expandable: boolean
) => {
  const rowEl = stringToHTML(
    '<tr><td><input data-row-selector type="checkbox" /></td></tr>'
  );
  parsers.forEach((parser, i) => {
    if ("setValue" in parser) {
      const itemEl = parser.html(null, values?.[i] ?? null, () => {
        onChange?.(getRowValues(baseEl, parsers, expandable));
      });
      rowEl.appendChild(itemEl);
    }
  });
  return rowEl;
};

export const collectionParser = <
  const F extends readonly [InputConfig, ...InputConfig[]],
>(
  cfg: ConfigCollection<F>
): Parser<Required<typeof cfg>["default"]> => {
  const childParsers = cfg.fields.map(inputParser);
  const isDefault = isExact(cfg.default);
  return {
    serialise: (value, shortUrl) =>
      value
        .map(row =>
          filterAndMap(childParsers, (parser, i) =>
            "serialise" in parser
              ? parser.serialise(
                  row[i] ?? raise(new Error("Value not found in collection")),
                  shortUrl
                )
              : null
          ).join(",")
        )
        .join(","),
    deserialise: (value, shortUrl) => {
      const flatValues = value.split(",");
      const rowLength = childParsers.reduce(
        (acc, parser) => acc + Number("deserialise" in parser),
        0
      );
      return new Array(Math.floor(flatValues.length / rowLength))
        .fill(null)
        .map(
          (_, rowIdx) =>
            childParsers.map((parser, parserIdx) =>
              "deserialise" in parser
                ? parser.deserialise(
                    flatValues[rowIdx * rowLength + parserIdx] ??
                      raise(new Error("Something went wrong deserialising")),
                    shortUrl
                  )
                : (cfg.fields[parserIdx]?.default ?? null)
            ) as TupledStateType<F>
        );
    },
    getValue: el =>
      getRowValues(
        el,
        childParsers as { [K in keyof F]: Parser<DefaultType<F[K]>> },
        cfg.expandable ?? false
      ),
    setValue: (el, value, onChange) => {
      const container = dom.get("tbody", el);
      container.innerHTML = "";
      const rows = value.map(rowValues =>
        newRow(
          el,
          onChange,
          childParsers as { [K in keyof F]: Parser<DefaultType<F[K]>> },
          rowValues,
          cfg.expandable ?? false
        )
      );
      container.append(...rows);
    },
    hasChanged: value =>
      (cfg.default == null && value.length > 0) || !isDefault(value),
    html: (id, initial, onChange) => {
      const baseEl = stringToHTML(`
      <div id="${id}" class="collection">
        <a class="heading">
          <span class="collection-label">${cfg.label}</span>
          <span class="collection-caret"></span>
        </a>
        <div class="collection-container">
          <div class="collection-content">
            <table>
              <thead>
                <tr class="wrap-text">
                  ${
                    cfg.expandable
                      ? `<th scope="col" class="row-select"></th>`
                      : ""
                  }
                  ${cfg.fields
                    .map(
                      childCfg =>
                        `<th scope="col" >${childCfg.label ?? ""}</th>`
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          ${
            cfg.expandable
              ? `<div class="collection-actions">
                <button type="button" class="secondary" data-action="delete">
                  <span class="width-large">Delete Selected</span>
                  <span class="width-narrow icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512">
                      <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                    </svg>
                  </span>
                </button>
                <button type="button" class="primary" data-action="add">
                  <span class="width-large">Add Row</span>
                  <span class="width-narrow icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512">
                      <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
                    </svg>
                  </span>
                </button>
              </div>`
              : ""
          }
        </div>
      </div>
      `);

      const defaultRows =
        (initial ?? cfg.default)?.map(rowDefaults =>
          newRow(
            baseEl,
            onChange,
            childParsers as { [K in keyof F]: Parser<DefaultType<F[K]>> },
            rowDefaults,
            cfg.expandable ?? false
          )
        ) ?? [];
      dom.get("tbody", baseEl).append(...defaultRows);

      if (cfg.expandable) {
        dom.addListener(dom.get("button[data-action=delete]"), "click", () => {
          [...dom.get("tbody", baseEl).children].forEach(row => {
            if (dom.get<HTMLInputElement>("[data-row-selector]", row).checked) {
              row.remove();
            }
          });
          onChange(
            getRowValues(
              baseEl,
              childParsers as {
                [K in keyof F]: Parser<DefaultType<F[K]>>;
              },
              cfg.expandable ?? false
            )
          );
        });
        dom.addListener(dom.get("button[data-action=add]"), "click", () => {
          dom.get("tbody", baseEl).appendChild(
            newRow(
              baseEl,
              onChange,
              childParsers as {
                [K in keyof F]: Parser<DefaultType<F[K]>>;
              },
              null,
              cfg.expandable ?? false
            )
          );
        });
      }

      return baseEl;
    },
  };
};

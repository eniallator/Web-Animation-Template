import { dom, filterAndMap, raise } from "@web-art/core";
import { isExact } from "deep-guards";
import { stringToHTML, valueParser } from "../helpers.js";
import { ValueParserTuple } from "../types.js";

const getRowValues = <const F extends readonly [unknown, ...unknown[]]>(
  baseEl: Element,
  parsers: ValueParserTuple<F>,
  expandable: boolean
): F[] => {
  const container = dom.get("tbody", baseEl);
  return [...container.querySelectorAll("tr")].map(el => {
    const itemEls = [...el.children].map(el =>
      el.children.item(0)
    ) as (HTMLElement | null)[];
    return parsers.map((parser, i) =>
      parser.getValue(
        itemEls[i + (expandable ? 1 : 0)] ??
          raise(
            new Error(
              "Did not find an item element when getting a collections values"
            )
          )
      )
    ) as unknown as F;
  });
};

const newRow = <const F extends readonly [unknown, ...unknown[]]>(
  baseEl: Element,
  onChange: ((value: F[]) => void) | null,
  parsers: ValueParserTuple<F>,
  values: F | null,
  expandable: boolean
) => {
  const rowEl = stringToHTML(
    '<tr><td><input data-row-selector type="checkbox" /></td></tr>'
  );
  parsers.forEach((parser, i) => {
    const td = document.createElement("td");
    td.appendChild(
      // rowEl.appendChild(
      parser.html(null, values?.[i] ?? null, () => {
        onChange?.(getRowValues(baseEl, parsers, expandable));
      })
    );
    rowEl.appendChild(td);
  });
  return rowEl;
};

interface CollectionConfig<F extends readonly [unknown, ...unknown[]]> {
  label?: string;
  expandable?: boolean;
  fields: ValueParserTuple<F>;
  default?: NoInfer<F>[];
}

export const collectionParser = <
  const F extends readonly [unknown, ...unknown[]],
>(
  cfg: CollectionConfig<F>
) =>
  valueParser<F[]>({
    default: cfg.default ?? [],
    serialise: (value, shortUrl) =>
      value
        .map(row =>
          filterAndMap(cfg.fields, (parser, i) =>
            parser.serialise(
              row[i] ?? raise(new Error("Value not found in collection")),
              shortUrl
            )
          ).join(",")
        )
        .join(","),
    deserialise: (value, shortUrl) => {
      const flatValues = value.split(",");
      return new Array(Math.floor(flatValues.length / cfg.fields.length))
        .fill(null)
        .map(
          (_, rowIdx) =>
            cfg.fields.map((parser, parserIdx) =>
              parser.deserialise(
                flatValues[rowIdx * cfg.fields.length + parserIdx] ??
                  raise(new Error("Something went wrong deserialising")),
                shortUrl
              )
            ) as unknown as F
        );
    },
    getValue: el => getRowValues(el, cfg.fields, cfg.expandable ?? false),
    setValue: (el, value, onChange) => {
      const container = dom.get("tbody", el);
      container.innerHTML = "";
      const rows = value.map(rowValues =>
        newRow(el, onChange, cfg.fields, rowValues, cfg.expandable ?? false)
      );
      container.append(...rows);
    },
    hasChanged: value =>
      (cfg.default == null && value.length > 0) || !isExact(cfg.default)(value),
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
                    .map(field => `<th scope="col" >${field.label ?? ""}</th>`)
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
            cfg.fields,
            rowDefaults,
            cfg.expandable ?? false
          )
        ) ?? [];
      dom.get("tbody", baseEl).append(...defaultRows);

      if (cfg.expandable) {
        dom.addListener(
          dom.get("button[data-action=delete]", baseEl),
          "click",
          () => {
            [...dom.get("tbody", baseEl).children].forEach(row => {
              if (
                dom.get<HTMLInputElement>("[data-row-selector]", row).checked
              ) {
                row.remove();
              }
            });
            onChange(getRowValues(baseEl, cfg.fields, cfg.expandable ?? false));
          }
        );
        dom.addListener(
          dom.get("button[data-action=add]", baseEl),
          "click",
          () => {
            dom
              .get("tbody", baseEl)
              .appendChild(
                newRow(
                  baseEl,
                  onChange,
                  cfg.fields,
                  null,
                  cfg.expandable ?? false
                )
              );
          }
        );
      }

      return baseEl as HTMLElement;
    },
  });

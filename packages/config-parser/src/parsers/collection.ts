import { dom, filterAndMap, raise, tuple } from "@web-art/core";
import { isExact } from "deep-guards";

import { valueParser } from "../create.ts";
import { InitValueParserTuple, ValueParserTuple } from "../types.ts";

const noItemErr = () =>
  new Error("Did not find an item element when getting a collections values");
const getRowValues = <const F extends readonly [unknown, ...unknown[]]>(
  baseEl: Element,
  parsers: ValueParserTuple<F>[],
  expandable: boolean
): F[] => {
  const container = dom.get("tbody", baseEl);
  return [...container.querySelectorAll("tr")].map((el, i) => {
    const itemEls = el.querySelectorAll<HTMLElement>("td > *");
    return parsers[i]?.map((parser, i) =>
      parser.getValue(itemEls[i + (expandable ? 1 : 0)] ?? raise(noItemErr()))
    ) as unknown as F;
  });
};

const newRow = <const F extends readonly [unknown, ...unknown[]]>({
  queryItems,
  initialItems,
  itemDefaults,
  getValue,
  onChange,
  initParsers,
  expandable,
  shortUrl,
}: {
  queryItems?: (string | null)[];
  initialItems?: F;
  itemDefaults?: F;
  getValue: () => F;
  onChange: (value: F) => void;
  initParsers: InitValueParserTuple<F>;
  expandable: boolean;
  shortUrl: boolean;
}) => {
  const rowEl = dom.toHtml("<tr></tr>");
  if (expandable) {
    rowEl.innerHTML = '<td><input data-row-selector type="checkbox" /></td>';
  }
  const parsers = initParsers.map(({ methods }, i) => {
    const parser = methods(
      (value: F[number]) => {
        onChange(getValue().with(i, value) as unknown as F);
      },
      () => getValue()[i],
      itemDefaults?.[i] != null
        ? { initial: initialItems?.[i] ?? null, default: itemDefaults[i] }
        : undefined
    );
    const td = document.createElement("td");
    td.appendChild(parser.html(null, queryItems?.[i] ?? null, shortUrl));
    rowEl.appendChild(td);
    return parser;
  }) as ValueParserTuple<F>;
  return tuple(rowEl, parsers);
};

interface CollectionConfig<F extends readonly [unknown, ...unknown[]]> {
  label?: string;
  expandable?: boolean;
  initialCollapsed?: boolean;
  fields: InitValueParserTuple<F>;
  default: NoInfer<F>[];
}

export const collectionParser = <
  const F extends readonly [unknown, ...unknown[]],
>(
  cfg: CollectionConfig<F>
) => {
  const isDefault = isExact(cfg.default);
  const expandable = cfg.expandable ?? false;
  let fieldParsers: ValueParserTuple<F>[] = [];
  return valueParser<F[]>((onChange, getValue) => ({
    default: cfg.default,
    serialise: shortUrl =>
      isDefault(getValue())
        ? null
        : fieldParsers
            .map(row => row.map(parser => parser.serialise(shortUrl)).join(","))
            .join(","),
    getValue: el => getRowValues(el, fieldParsers, expandable),
    updateValue: (el, shortUrl) => {
      const container = dom.get("tbody", el);
      container.innerHTML = "";
      const rows = getValue().map((row, i) =>
        newRow({
          initialItems: row,
          itemDefaults: cfg.default[i],
          getValue: () => getValue()[i] as F,
          onChange: value => {
            onChange(getValue().with(i, value));
          },
          initParsers: cfg.fields,
          shortUrl,
          expandable,
        })
      );
      fieldParsers = rows.map(([rowEl, parsers]) => {
        container.appendChild(rowEl);
        return parsers;
      });
    },
    html: (id, query, shortUrl) => {
      const ifExpandable = (html: string) => (expandable ? html : "");
      const colHtml = (title?: string, label?: string) =>
        `<th scope="col" title="${title ?? label ?? ""}">${label ?? ""}</th>`;
      const baseEl = dom.toHtml(`
        <div id="${id}" class="collection${cfg.initialCollapsed ? " collapsed" : ""}">
          <a class="heading">
            <span class="collection-label">${cfg.label}</span>
            <span class="collection-caret"></span>
          </a>
          <div class="collection-container">
            <div class="collection-content">
              <table>
                <thead>
                  <tr class="wrap-text">
                    ${ifExpandable(colHtml("row-select"))}
                    ${cfg.fields.map(({ title, label }) => colHtml(title, label)).join("")}
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            ${ifExpandable(`
              <div class="collection-actions">
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
              </div>`)}
          </div>
        </div>
      `);

      dom.addListener(dom.get(".heading", baseEl), "click", () => {
        baseEl.classList.toggle("collapsed");
      });

      const bodyEl = dom.get("tbody", baseEl);

      const flatQueryValues = (query?.split(",") ?? []).map(s =>
        s.length > 0 ? s : null
      );
      const numFields = cfg.fields.length;
      const numQueryValues = Math.floor(flatQueryValues.length / numFields);
      const queryValues = [...new Array<undefined>(numQueryValues)].map(
        (_, i) => flatQueryValues.slice(i * numFields, (i + 1) * numFields)
      );

      const numParsers = (
        expandable && queryValues.length > 0 ? queryValues : cfg.default
      ).length;
      fieldParsers = [...new Array<undefined>(numParsers)].map((_, i) => {
        const [el, parsers] = newRow({
          queryItems: queryValues[i],
          initialItems: cfg.default[i],
          itemDefaults: cfg.default[i],
          getValue: () => getValue()[i] as F,
          onChange: newRow => {
            onChange(getValue().with(i, newRow));
          },
          initParsers: cfg.fields,
          shortUrl,
          expandable,
        });

        bodyEl.appendChild(el);

        return parsers;
      });

      if (expandable) {
        const deleteButton = dom.get("button[data-action=delete]", baseEl);
        dom.addListener(deleteButton, "click", () => {
          const newValue = filterAndMap([...bodyEl.children], (el, i) => {
            const values = getValue()[i] as F;
            if (dom.get<HTMLInputElement>("[data-row-selector]", el).checked) {
              el.remove();
              return null;
            }
            return values;
          });

          fieldParsers = newValue.map((initial, i) => {
            const [_el, parsers] = newRow({
              initialItems: initial,
              getValue: () => getValue()[i] as F,
              onChange: value => {
                onChange(getValue().with(i, value));
              },
              initParsers: cfg.fields,
              shortUrl,
              expandable,
            });
            return parsers;
          });

          onChange(newValue);
        });

        const addButton = dom.get("button[data-action=add]", baseEl);
        dom.addListener(addButton, "click", () => {
          const idx = fieldParsers.length;
          const [el, parsers] = newRow({
            getValue: () => getValue()[idx] as F,
            onChange: value => {
              onChange(getValue().with(idx, value));
            },
            initParsers: cfg.fields,
            shortUrl,
            expandable,
          });

          bodyEl.appendChild(el);

          fieldParsers.push(parsers);

          onChange(getRowValues(baseEl, fieldParsers, expandable));
        });
      }

      return baseEl;
    },
  }));
};

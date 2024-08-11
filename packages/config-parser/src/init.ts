import { Option, dom, filterAndMap, raise } from "@web-art/core";
import { inputType } from "./create.js";
import { DeriveDefaults, DeriveStateType } from "./derive.js";
import { changeCallback, inputCallback, inputValue } from "./event.js";
import { deserialise, isSerialisable } from "./serialise.js";
import {
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  FileConfig,
  InputConfig,
  OnUpdate,
  SelectConfig,
  StateItem,
} from "./types.js";

function setAttributes(el: HTMLElement, attrs: Record<string, string>): void {
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
}

function initCollectionRowHtml<F extends ConfigCollectionFields>(
  baseEl: HTMLElement,
  config: ConfigCollection<string, F>,
  rowValues: DeriveDefaults<F>,
  getCurrentValue: () => DeriveDefaults<F>,
  onUpdate: (newRow: DeriveDefaults<F>) => void
): DeriveDefaults<F> {
  const row = document.createElement("tr");
  if (config.expandable) {
    row.innerHTML = '<td><input data-row-selector type="checkbox" /></td>';
  }
  baseEl.appendChild(row);
  return config.fields.map((config, i) => {
    const itemEl = document.createElement("td");
    row.appendChild(itemEl);
    return initHtml(
      itemEl,
      config,
      rowValues[i] ?? null,
      () =>
        Option.some(getCurrentValue()[i]).getOrThrow(
          new Error("Received invalid value")
        ),
      newValue => {
        onUpdate(
          getCurrentValue().map((oldValue, j) =>
            i === j ? newValue : oldValue
          ) as DeriveDefaults<F>
        );
      },
      undefined,
      false
    );
  }) as DeriveDefaults<F>;
}

function initCollectionHtml<I extends string, F extends ConfigCollectionFields>(
  baseEl: HTMLElement,
  config: ConfigCollection<I, F>,
  value: DeriveDefaults<F>[] | null,
  getCurrentValue: () => DeriveDefaults<F>[],
  onUpdate: OnUpdate<ConfigCollection<I, F>>
): DeriveDefaults<F>[] {
  const html = `
    <div id="${config.id}" class="collection">
      <a class="heading">
        <span class="collection-label">${config.label}</span>
        <span class="collection-caret"></span>
      </a>
      <div class="collection-container">
        <div class="collection-content">
          <table>
            <thead>
              <tr class="wrap-text">
                ${
                  config.expandable
                    ? `<th scope="col" class="row-select"></th>`
                    : ""
                }
                ${config.fields
                  .map(
                    childConfig =>
                      `<th scope="col" >${
                        isSerialisable(childConfig) ? childConfig.label : ""
                      }</th>`
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        ${
          config.expandable
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
  `;
  baseEl.innerHTML = html;
  const collection = dom.get(`#${config.id}`, baseEl);
  dom.addListener(dom.get(".heading", collection), "click", () =>
    collection.classList.toggle("collapsed")
  );

  let id = 0;
  let idLookup: Record<string, number> = {};

  if (config.expandable) {
    dom.addListener(dom.get("button[data-action=delete]"), "click", () => {
      const indicesToDelete = filterAndMap(
        [...dom.get("tbody", collection).children],
        (row, i) => {
          if (dom.get<HTMLInputElement>("[data-row-selector]", row).checked) {
            row.remove();
            return i;
          } else {
            return null;
          }
        }
      );
      idLookup = Object.fromEntries(
        filterAndMap(Object.entries(idLookup), ([key, value]) =>
          indicesToDelete.includes(value)
            ? null
            : [key, value - indicesToDelete.filter(i => i < value).length]
        )
      );
      // for (const id in idLookup) {
      //   if (indicesToDelete.includes(idLookup[id])) {
      //     delete idLookup[id];
      //   } else {
      //     idLookup[id] -= indicesToDelete.filter(i => i < idLookup[id]).length;
      //   }
      // }
      onUpdate(
        getCurrentValue().filter(
          (_, i) => !indicesToDelete.includes(i)
        ) as DeriveStateType<typeof config>
      );
    });
    dom.addListener(dom.get("button[data-action=add]"), "click", () => {
      const currentValue = getCurrentValue();
      const rowId = `${id++}`;
      idLookup[rowId] = currentValue.length;
      const rowValues = initCollectionRowHtml(
        dom.get("tbody", collection),
        config,
        config.fields.map(field => field.default) as DeriveDefaults<F>,
        () =>
          Option.some(idLookup[rowId])
            .map(key => getCurrentValue()[key])
            .getOrThrow(new Error("Received invalid value")),
        newRow => {
          onUpdate(
            getCurrentValue().toSpliced(
              idLookup[rowId] ?? raise(new Error("Received invalid value")),
              1,
              newRow
            ) as DeriveStateType<typeof config>
          );
        }
      );
      onUpdate([...currentValue, rowValues] as DeriveStateType<typeof config>);
    });
  }

  return (
    value?.map((row, i) => {
      const rowId = `${id++}`;
      idLookup[rowId] = i;
      return initCollectionRowHtml(
        dom.get("tbody", collection),
        config,
        row,
        () =>
          Option.some(idLookup[rowId])
            .map(key => getCurrentValue()[key])
            .getOrThrow(new Error("Received invalid value")),
        newRow => {
          onUpdate(
            getCurrentValue().toSpliced(
              idLookup[rowId] ?? raise(new Error("Received invalid value")),
              1,
              newRow
            ) as DeriveStateType<typeof config>
          );
        }
      );
    }) ?? []
  );
}

function initHtml<C extends ConfigPart<string>>(
  baseEl: HTMLElement,
  config: C,
  value: DeriveStateType<C> | null,
  getCurrentValue: () => DeriveStateType<C>,
  onUpdate: OnUpdate<C>,
  onClick?: () => void,
  hasId: boolean = true
): DeriveStateType<C> {
  switch (config.type) {
    case "Button": {
      const inp = document.createElement("button");
      if (config.attrs != null) {
        setAttributes(inp, config.attrs);
      }
      inp.type = "button";
      if (hasId) {
        inp.setAttribute("id", config.id);
      }
      inp.className = "primary wrap-text";
      inp.innerText = config.text ?? "";
      inp.onclick = onClick ?? null;

      baseEl.appendChild(inp);
      return null as DeriveStateType<C>;
    }
    case "Collection": {
      return initCollectionHtml(
        baseEl,
        config,
        value as DeriveDefaults<typeof config.fields>[] | null,
        getCurrentValue as () => DeriveDefaults<ConfigCollectionFields>[],
        onUpdate as OnUpdate<ConfigCollection<string, ConfigCollectionFields>>
      ) as DeriveStateType<C>;
    }
    case "File": {
      const inp = document.createElement("input");
      if (config.attrs != null) {
        setAttributes(inp, config.attrs);
      }
      if (hasId) {
        inp.setAttribute("id", config.id);
      }
      inp.setAttribute("type", inputType(config.type));
      inp.style.display = "none";

      inp.onchange = changeCallback(
        config,
        onUpdate as OnUpdate<FileConfig<string>>
      );

      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = config.text ?? "";
      btn.className = "secondary wrap-text";
      btn.onclick = () => {
        inp.click();
      };

      baseEl.appendChild(inp);
      baseEl.appendChild(btn);

      return "" as DeriveStateType<C>;
    }
    case "Select": {
      const inp = document.createElement("select");
      if (config.attrs != null) {
        setAttributes(inp, config.attrs);
      }
      if (hasId) {
        inp.setAttribute("id", config.id);
      }
      inp.className = "form-select";

      inp.onchange = changeCallback(
        config,
        onUpdate as OnUpdate<SelectConfig<string>>
      );

      config.options.forEach(option => {
        const el = document.createElement("option");
        el.value = option;
        el.innerText = option;
        inp.appendChild(el);
      });

      inp.value = value != null ? `${value}` : "";

      baseEl.appendChild(inp);
      return inp.value as DeriveStateType<C>;
    }
    default: {
      let inp: HTMLInputElement | HTMLTextAreaElement;
      if (config.type === "Text" && config.area) {
        inp = document.createElement("textarea");
      } else {
        inp = document.createElement("input");
        inp.setAttribute("type", inputType(config.type));
      }

      if (config.attrs != null) {
        setAttributes(inp, config.attrs);
      }

      if (hasId) {
        inp.setAttribute("id", config.id);
      }

      inp.onchange = changeCallback(
        config,
        onUpdate as OnUpdate<InputConfig<string>>
      );

      inp.oninput = inputCallback(
        config,
        onUpdate as OnUpdate<InputConfig<string>>
      );

      if (config.type === "Checkbox") {
        if (value) {
          inp.setAttribute("checked", "");
        } else {
          inp.removeAttribute("checked");
        }
      } else if (config.type === "Color") {
        inp.value = `#${value}`;
      } else if (config.type === "Datetime") {
        if (value != null) {
          inp.value = value
            .toLocaleString()
            .replace(
              /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
              "$<y>-$<m>-$<d>T$<t>"
            );
        }
      } else {
        inp.value = `${value}`;
      }

      baseEl.appendChild(inp);
      return inputValue(config, inp) as DeriveStateType<C>;
    }
  }
}

export function initStateItem<C extends ConfigPart<string>>(
  baseEl: HTMLElement,
  config: C,
  serialisedInitial: string | null,
  shortUrl: boolean,
  getCurrentValue: () => DeriveStateType<C>,
  onUpdate: OnUpdate<C>,
  onClick?: () => void
): StateItem<C> {
  const container = document.createElement("div");
  container.className = "config-item";
  if (isSerialisable(config) && config.label != null) {
    const label = document.createElement("label");
    label.setAttribute("for", config.id);
    label.setAttribute("title", config.label);
    label.className = "wrap-text";
    label.innerText = config.label;
    container.appendChild(label);
  }

  const initialValue =
    isSerialisable(config) && serialisedInitial != null
      ? deserialise(config, serialisedInitial, shortUrl)
      : null;

  baseEl.appendChild(container);
  const value = initHtml(
    container,
    config,
    initialValue ??
      ((isSerialisable(config)
        ? (config.default ?? null)
        : null) as DeriveStateType<C> | null),
    getCurrentValue,
    onUpdate,
    onClick
  );

  return {
    value,
    config,
    clicked: false,
  };
}

import dom from "../core/dom";
import { filterAndMap, replaceItem } from "../core/utils";
import { inputType } from "./create";
import { DeriveDefaults, DeriveStateType } from "./derive";
import { changeCallback, inputCallback, inputValue } from "./event";
import { deserialise, isSerialisable } from "./serialise";
import {
  ConfigCollection,
  ConfigCollectionFields,
  ConfigPart,
  FileConfig,
  InputConfig,
  OnUpdate,
  StateItem,
} from "./types";

function setAttributes(
  el: HTMLElement,
  attrs: Record<string, string>
): HTMLElement {
  if (attrs) {
    for (let attr in attrs) {
      el.setAttribute(attr, attrs[attr]);
    }
  }
  return el;
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
      rowValues[i],
      () => getCurrentValue()[i],
      (newValue) => {
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
  value: Array<DeriveDefaults<F>> | null,
  getCurrentValue: () => Array<DeriveDefaults<F>>,
  onUpdate: OnUpdate<ConfigCollection<I, F>>
): Array<DeriveDefaults<F>> {
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
                    (childConfig) =>
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
              <button type="button" class="secondary" data-action="delete">Delete Selected</button>
              <button type="button" class="primary" data-action="add">Add Row</button>
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
  const idLookup: Record<string, number> = {};

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
      for (let id in idLookup) {
        if (indicesToDelete.includes(idLookup[id])) {
          delete idLookup[id];
        } else {
          idLookup[id] -= indicesToDelete.filter(
            (i) => i < idLookup[id]
          ).length;
        }
      }
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
        config.fields.map((field) => field.default) as DeriveDefaults<F>,
        () => getCurrentValue()[idLookup[rowId]],
        (newRow) =>
          onUpdate(
            replaceItem(
              getCurrentValue(),
              idLookup[rowId],
              newRow
            ) as DeriveStateType<typeof config>
          )
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
        () => getCurrentValue()[idLookup[rowId]],
        (newRow) =>
          onUpdate(
            replaceItem(
              getCurrentValue(),
              idLookup[rowId],
              newRow
            ) as DeriveStateType<typeof config>
          )
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
        Object.entries(config.attrs).forEach(([attr, value]) =>
          inp.setAttribute(attr, value)
        );
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
        value as Array<DeriveDefaults<typeof config.fields>> | null,
        getCurrentValue as () => Array<DeriveDefaults<ConfigCollectionFields>>,
        onUpdate as OnUpdate<ConfigCollection<string, ConfigCollectionFields>>
      ) as DeriveStateType<C>;
    }
    case "File": {
      const inp = document.createElement("input");
      if (config.attrs != null) {
        Object.entries(config.attrs).forEach(([attr, value]) =>
          inp.setAttribute(attr, value)
        );
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
      btn.onclick = () => inp.click();

      baseEl.appendChild(inp);
      baseEl.appendChild(btn);

      return "" as DeriveStateType<C>;
    }
    case "Select": {
      const inp = document.createElement("select");
      if (config.attrs != null) {
        Object.entries(config.attrs).forEach(([attr, value]) =>
          inp.setAttribute(attr, value)
        );
      }
      if (hasId) {
        inp.setAttribute("id", config.id);
      }
      inp.className = "form-select";

      config.options?.forEach((option) => {
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
      const inp = document.createElement("input");
      if (config.attrs != null) {
        Object.entries(config.attrs).forEach(([attr, value]) =>
          inp.setAttribute(attr, value)
        );
      }

      if (hasId) {
        inp.setAttribute("id", config.id);
      }
      inp.setAttribute("type", inputType(config.type));

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
    // if (config.tooltip != null) {
    //   label.setAttribute("data-toggle", "tooltip");
    //   label.setAttribute("data-placement", "top");
    //   label.setAttribute("title", config.tooltip).tooltip();
    // }
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
        ? config.default ?? null
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

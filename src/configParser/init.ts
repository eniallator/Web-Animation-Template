import { replaceItem } from "../core/utils";
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
  const row = document.createElement(
    '<td><input data-row-selector type="checkbox" /></td>'
  );
  baseEl.appendChild(row);
  return config.fields.map((config, i) =>
    initHtml(
      row,
      config,
      rowValues[i],
      () => getCurrentValue()[i],
      (newValue) => {
        onUpdate(
          getCurrentValue().map((oldValue, j) =>
            i === j ? newValue : oldValue
          ) as DeriveDefaults<F>
        );
      }
    )
  ) as DeriveDefaults<F>;
}

function initCollectionHtml<I extends string, F extends ConfigCollectionFields>(
  baseEl: HTMLElement,
  config: ConfigCollection<I, F>,
  value: Array<DeriveDefaults<F>> | null,
  getCurrentValue: () => Array<DeriveDefaults<F>>,
  onUpdate: OnUpdate<ConfigCollection<I, F>>
): Array<DeriveDefaults<F>> {
  const html = `
    <div class="collection">
      <a class="config-item text-decoration-none text-white collapsed d-flex justify-content-between"
        data-toggle="collapse" href="#${config.id}">
        <span>${config.label}</span>
        <span class="collection-caret"></span>
      </a>
      <div class="collapse config-item table-responsive" id="${config.id}">
        <table class="table table-sm table-dark text-light table-hover">
          <thead>
            <tr>
              ${
                config.expandable
                  ? '<th scope="col" style="border-bottom: none;"></th>'
                  : ""
              }
              ${config.fields
                .map(
                  (childConfig) =>
                    '<th scope="col" style="border-bottom: none;">' +
                    (isSerialisable(childConfig) ? childConfig.label : "") +
                    "</th>"
                )
                .join("")}
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        ${
          config.expandable
            ? `<div class="d-flex justify-content-between collection-footer">
              <button class="btn btn-sm btn-warning float-right" data-action="delete">Delete Selected</button>
              <button class="btn btn-sm btn-primary float-right" data-action="add">Add Row</button>
            </div>`
            : ""
        }
      </div>
    </div>
  `;
  baseEl.innerHTML = html;

  const baseRowEl = baseEl.querySelector("tbody") as HTMLTableSectionElement;
  return (
    value?.map((row, i) =>
      initCollectionRowHtml(
        baseRowEl,
        config,
        row,
        () => getCurrentValue()[i],
        (newRow) =>
          onUpdate(
            replaceItem(getCurrentValue(), i, newRow) as DeriveStateType<
              typeof config
            >
          )
      )
    ) ?? []
  );
}

function initHtml<C extends ConfigPart<string>>(
  baseEl: HTMLElement,
  config: C,
  value: DeriveStateType<C> | null,
  getCurrentValue: () => DeriveStateType<C>,
  onUpdate: OnUpdate<C>,
  onClick?: () => void
): DeriveStateType<C> {
  switch (config.type) {
    case "Button": {
      const inp = document.createElement("button");
      inp.setAttribute("id", config.id);
      inp.className = "btn btn-info";
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
      inp.setAttribute("id", config.id);
      inp.setAttribute("type", inputType(config.type));
      inp.style.display = "none";

      inp.onchange = changeCallback(
        config as FileConfig<string>,
        onUpdate as OnUpdate<FileConfig<string>>
      );

      const btn = document.createElement("button");
      btn.innerText = config.text ?? "";
      btn.className = "btn btn-secondary";
      btn.onclick = () => inp.click();

      const html = document.createElement("div");
      html.appendChild(inp);
      html.appendChild(btn);

      baseEl.appendChild(html);
      return "" as DeriveStateType<C>;
    }
    case "Select": {
      const inp = document.createElement("select");
      inp.setAttribute("id", config.id);
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
      inp.setAttribute("id", config.id);
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
      } else {
        inp.value = config.type === "Color" ? `#${value}` : `${value}`;
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

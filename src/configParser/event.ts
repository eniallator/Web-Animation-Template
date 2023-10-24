import { hasKey, isString } from "../core/guard";
import { checkExhausted } from "../core/utils";
import { DeriveStateType } from "./derive";
import { InputConfig, OnUpdate } from "./types";

export function inputValue<C extends InputConfig<string>>(
  config: C,
  el: HTMLInputElement
): DeriveStateType<C> {
  switch (config.type) {
    case "Checkbox":
      return el.hasAttribute("checked") as DeriveStateType<C>;
    case "Color":
      return el.value.slice(1).toUpperCase() as DeriveStateType<C>;
    case "File":
      return "" as DeriveStateType<C>;
    case "Number":
    case "Range":
      return Number(el.value) as DeriveStateType<C>;
    case "Datetime":
      return new Date(el.value) as DeriveStateType<C>;
    case "Select":
    case "Text":
      return el.value as DeriveStateType<C>;
    default:
      return checkExhausted(config);
  }
}

export function inputCallback<C extends InputConfig<string>>(
  config: C,
  onUpdate: OnUpdate<C>
): ((evt: Event) => void) | null {
  switch (config.type) {
    case "Checkbox":
    case "Datetime":
    case "File":
    case "Number":
    case "Range":
    case "Select":
    case "Text":
      return null;
    case "Color":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(
              evt.target.value.slice(1).toUpperCase() as DeriveStateType<C>
            )
          : null;
    default:
      return checkExhausted(config);
  }
}

export function changeCallback<C extends InputConfig<string>>(
  config: C,
  onUpdate: OnUpdate<C>
): ((evt: Event) => void) | null {
  switch (config.type) {
    case "Color":
      return null;
    case "Checkbox":
      return (evt) => {
        onUpdate(
          (evt.target as HTMLInputElement).checked as DeriveStateType<C>
        );
      };
    case "Datetime":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(new Date(evt.target.value) as DeriveStateType<C>)
          : null;
    case "Select":
    case "Text":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(evt.target.value as DeriveStateType<C>)
          : null;
    case "File":
      return (evt) =>
        new Promise<void>(() => {
          const target = evt.target as HTMLInputElement;
          if (target.files?.[0] != null) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              onUpdate(evt.target?.result as DeriveStateType<C>);
            };
            reader.readAsDataURL(target.files[0]);
          }
        });

    case "Number":
    case "Range":
      return (evt) =>
        hasKey(evt.target, "value", isString)
          ? onUpdate(+evt.target.value as DeriveStateType<C>)
          : null;
    default:
      return checkExhausted(config);
  }
}

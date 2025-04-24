import { dom, tuple } from "@web-art/core";
import { isOneOf } from "deep-guards";

import { valueParser } from "../../create.ts";

import type { ValueConfig } from "../../types.ts";

type SelectValue<A extends readonly [string, ...string[]]> = A[number];

export const selectParser = <const A extends readonly [string, ...string[]]>(
  cfg: ValueConfig<SelectValue<A>> & { options: A }
) => {
  const isOption = isOneOf(...cfg.options);
  const defaultValue = cfg.default ?? (cfg.options[0] as SelectValue<A>);

  return valueParser<SelectValue<A>>(
    (onChange, getValue, externalCfg) => ({
      default: defaultValue,
      serialise: () =>
        getValue() !==
        (externalCfg != null ? externalCfg.default : defaultValue)
          ? getValue()
          : null,
      updateValue: el => {
        (el as HTMLSelectElement).value = getValue();
      },
      getValue: el => (el as HTMLSelectElement).value as SelectValue<A>,
      html: (id, query) => {
        const initial = isOption(query)
          ? query
          : isOption(externalCfg?.initial)
            ? externalCfg.initial
            : (externalCfg?.default ?? defaultValue);

        const attrs = dom.toAttrs(
          Object.entries<string | null>(cfg.attrs ?? {}).concat([
            ...(id != null ? [tuple("id", id)] : []),
          ])
        );

        const el = dom.toHtml<HTMLSelectElement>(
          `<select${attrs}>${cfg.options
            .map(
              opt =>
                `<option value="${opt}" ${opt === initial ? " selected" : ""}>
                  ${opt}
                </option>`
            )
            .join("")}</select>`
        );
        el.onchange = () => {
          onChange(el.value as SelectValue<A>);
        };
        return el;
      },
    }),
    cfg.label,
    cfg.title
  );
};

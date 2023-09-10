import {
  buttonConfig,
  checkboxConfig,
  colorConfig,
  config,
  configCollection,
  datetimeConfig,
  fileConfig,
  numberConfig,
  rangeConfig,
  selectConfig,
  textConfig,
} from "../configParser/create";
import { State } from "../configParser/derive";
import { CompleteConfig, ConfigPart } from "../configParser/types";

const cfg = config(
  checkboxConfig({
    id: <const>"example-checkbox",
    label: "Example Checkbox",
    tooltip: "Example tooltip",
    default: true,
  }),
  rangeConfig({
    id: <const>"example-range",
    label: "Example Range",
    default: 5,
    attrs: {
      min: "1",
      max: "10",
      step: "0.5",
    },
  }),
  numberConfig({
    id: <const>"example-number",
    label: "Example Number",
    default: 5,
    attrs: {
      min: "1",
      max: "10",
    },
  }),
  colorConfig({
    id: <const>"example-colour",
    label: "Example Colour",
    default: "FF5A5F",
  }),
  buttonConfig({
    id: <const>"example-button",
    text: "Example Button",
  }),
  fileConfig({
    id: <const>"example-file",
    text: "Example File",
    attrs: {
      accept: "image/*",
    },
  }),
  textConfig({
    id: <const>"example-text",
    label: "Example Text",
    default: "Hello",
    attrs: {
      placeholder: "World!",
    },
  }),
  datetimeConfig({
    id: <const>"example-datetime",
    label: "Example Date Time",
    default: new Date("2018-06-14T10:03"),
  }),
  selectConfig({
    id: <const>"example-select",
    label: "Example Select",
    default: "bar",
    options: <const>["foo", "bar", "baz", "Another Option"],
  }),
  configCollection({
    id: <const>"example-collection",
    label: "Example Collection",
    expandable: true,
    fields: <const>[
      rangeConfig({
        id: "example-collection-range",
        label: "Example Range Field",
        default: 2,
        attrs: {
          min: "0",
          max: "4",
          step: "1",
        },
      }),
      checkboxConfig({
        id: "example-collection-checkbox",
        label: "Example Checkbox Field",
        default: false,
      }),
    ],
    default: [
      [4, true],
      [1, false],
    ],
  })
);

function createState<I extends string, C extends ConfigPart<I>>(
  cfg: CompleteConfig<C>
): State<C> {
  return {} as State<C>;
}

const myState = createState(cfg);

myState["example-button"].config.type === "Button";
myState["example-checkbox"].config.type === "Checkbox";
myState["example-colour"].config.type === "Checkbox";

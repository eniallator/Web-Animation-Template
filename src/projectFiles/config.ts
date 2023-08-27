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

export default config(
  checkboxConfig({
    id: "example-checkbox",
    label: "Example Checkbox",
    tooltip: "Example tooltip",
    default: true,
  }),
  rangeConfig({
    id: "example-range",
    label: "Example Range",
    default: 5,
    attrs: {
      min: "1",
      max: "10",
      step: "0.5",
    },
  }),
  numberConfig({
    id: "example-number",
    label: "Example Number",
    default: 5,
    attrs: {
      min: "1",
      max: "10",
    },
  }),
  colorConfig({
    id: "example-colour",
    label: "Example Colour",
    default: "FF5A5F",
  }),
  buttonConfig({
    id: "example-button",
    text: "Example Button",
  }),
  fileConfig({
    id: "example-file",
    text: "Example File",
    attrs: {
      accept: "image/*",
    },
  }),
  textConfig({
    id: "example-text",
    label: "Example Text",
    default: "Hello",
    attrs: {
      placeholder: "World!",
    },
  }),
  datetimeConfig({
    id: "example-datetime",
    label: "Example Date Time",
    default: "2018-06-14T10:03",
  }),
  selectConfig({
    id: "example-select",
    label: "Example Select",
    default: "bar",
    options: <const>["foo", "bar", "baz", "Another Option"],
  }),
  configCollection({
    id: "example-collection",
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
    defaults: [
      [4, true],
      [1, false],
    ],
  })
);

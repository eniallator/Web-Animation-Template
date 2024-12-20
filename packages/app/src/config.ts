import {
  buttonParser,
  checkboxParser,
  collectionParser,
  colorParser,
  createParsers,
  datetimeParser,
  fileParser,
  numberParser,
  rangeParser,
  selectParser,
  textParser,
} from "@web-art/config-parser";

export const config = createParsers({
  "example-checkbox": checkboxParser({
    label: "Example Checkbox",
    title: "Example title",
    default: true,
  }),
  "example-range": rangeParser({
    label: "Example Range",
    default: 7.5,
    attrs: {
      min: "1",
      max: "10",
      step: "0.5",
    },
  }),
  "example-number": numberParser({
    label: "Example Number",
    default: 5,
    attrs: {
      min: "1",
      max: "10",
    },
  }),
  "example-colour": colorParser({
    label: "Example Colour",
    default: "FF5A5F",
  }),
  "example-button": buttonParser({
    text: "Example Button",
  }),
  "example-file": fileParser({
    text: "Example File",
    attrs: {
      accept: "image/*",
    },
  }),
  "example-text": textParser({
    label: "Example Text",
    default: "Hello",
    area: true,
    attrs: {
      placeholder: "World!",
    },
  }),
  "example-datetime": datetimeParser({
    label: "Example Date Time",
    default: new Date("2018-06-14T10:03"),
  }),
  "example-select": selectParser({
    label: "Example Select",
    default: "bar",
    options: ["foo", "bar", "baz", "another option"],
  }),
  "example-collection": collectionParser({
    label: "Example Collection",
    expandable: true,
    fields: [
      rangeParser({
        label: "Range",
        default: 2,
        attrs: {
          min: "0",
          max: "4",
          step: "1",
        },
      }),
      checkboxParser({
        label: "Checkbox",
        default: false,
      }),
      selectParser({
        label: "Select",
        default: "Maybe",
        options: ["Yes", "No", "Maybe"],
      }),
    ],
    default: [
      [4, true, "Yes"],
      [1, false, "No"],
    ],
  }),
});

import {
  buttonContent,
  checkboxParser,
  colorParser,
  createParsers,
  datetimeParser,
  dependency,
  derived,
  dividerContent,
  equals,
  fileParser,
  groupParser,
  headingContent,
  ifParser,
  imageContent,
  listParser,
  negate,
  numberParser,
  paragraphContent,
  rangeParser,
  rawHtmlContent,
  satisfies,
  selectParser,
  tableParser,
  textParser,
  unless,
  when,
  type ResolvedParserObject,
  type SeriFormOptions,
} from "seriform";

export const options: SeriFormOptions = { query: location.search };
export const config = createParsers({
  "example-heading": headingContent({ text: "Seriform Showcase", level: 3 }),
  "example-paragraph": paragraphContent({
    text: "Every parser and content element Seriform ships with is used below.",
  }),
  "example-divider": dividerContent({}),
  "example-image": imageContent({
    attrs: { src: "./logo.webp", alt: "Example image", width: 50 },
  }),
  "example-raw-html": rawHtmlContent({
    html: "<em>Raw HTML</em> inside a wrapper <code>div</code>",
  }),
  "example-checkbox": checkboxParser({
    label: "Example Checkbox",
    title: "Example title",
    default: true,
  }),
  "example-range": rangeParser({
    label: "Example Range",
    default: 7.5,
    attrs: { min: "1", max: "10", step: "0.5" },
  }),
  "example-number": numberParser({
    label: "Example Number",
    default: 5,
    attrs: { min: "1", max: "10" },
  }),
  "example-colour": colorParser({
    label: "Example Colour",
    default: "ff5a5f",
  }),
  "example-button": buttonContent({
    text: "Example Button",
    attrs: { class: "primary wrap-text" },
  }),
  "example-file": fileParser({
    text: "Example File",
    attrs: { accept: "image/*" },
  }),
  "example-text": textParser({
    label: "Example Text",
    default: "Hello",
    area: true,
    attrs: { placeholder: "World!" },
  }),
  "example-datetime": datetimeParser({
    label: "Example Date Time",
    default: new Date("2018-06-14T10:03Z"),
  }),
  "example-select": selectParser({
    label: "Example Select",
    default: "bar",
    options: ["foo", "bar", "baz", "another option"],
    hashLength: 3,
  }),
  "example-derived-paragraph": paragraphContent({
    text: derived(
      (range, select) => `Range is ${range} and select is '${select}'.`,
      dependency<number>()("example-range"),
      dependency<string>()("example-select")
    ),
  }),
  "example-derived-button": buttonContent({
    text: derived(
      checked => (checked ? "Checkbox is on" : "Checkbox is off"),
      dependency<boolean>()("example-checkbox")
    ),
    attrs: { class: "primary wrap-text" },
  }),
  "example-derived-heading": headingContent({
    level: 4,
    text: derived(
      text => `Text length: ${text.length}`,
      dependency<string>()("example-text")
    ),
  }),
  "example-table": tableParser({
    label: "Example Table",
    expandable: true,
    initialCollapsed: true,
    fields: [
      rangeParser({
        label: "Range",
        default: 2,
        attrs: { min: "0", max: "4", step: "1" },
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
  "example-list": listParser({
    label: "Example List",
    expandable: true,
    initialCollapsed: true,
    field: colorParser({ default: "ff0000" }),
    default: ["ff0000", "00ff00", "0000ff"],
  }),
  "example-group": groupParser({
    children: {
      "nested-text": textParser({
        label: "Nested Text",
        default: "Hi",
      }),
      "nested-checkbox": checkboxParser({
        label: "Nested Checkbox",
        default: false,
      }),
      "nested-when": when({
        condition: equals(["..", "example-checkbox"], true),
        parser: textParser({
          label: "Only Shown When Example Checkbox Is Checked",
          default: "",
        }),
        label: "Nested When",
        title:
          "'..' reaches out of this group to the root-level example-checkbox field",
      }),
    },
    label: "Example Group",
    title: "A few fields nested together",
    hashLength: 3,
  }),
  "example-when": when({
    condition: equals(["example-select"], "bar"),
    parser: textParser({
      label: "Only Shown When Select Is 'bar'",
      default: "",
    }),
    label: "Example When",
    title: "Visible only while example-select equals 'bar'",
  }),
  "example-unless": unless({
    condition: equals(["example-checkbox"], true),
    parser: numberParser({
      label: "Hidden Once Checkbox Is Checked",
      default: 0,
      attrs: { min: "0", max: "10" },
    }),
    label: "Example Unless",
  }),
  "example-negate": when({
    condition: negate(equals(["example-select"], "bar")),
    parser: textParser({
      label: "Only Shown When Select Is Not 'bar'",
      default: "",
    }),
    label: "Example Negate",
    title:
      "negate() inverts a condition, which is what unless() does internally",
  }),
  "example-derived-when": when({
    condition: derived(
      (range, checked) => range > 5 && checked,
      dependency<number>()("example-range"),
      dependency<boolean>()("example-checkbox")
    ),
    parser: textParser({
      label: "Only Shown When Range > 5 And Checkbox Is Checked",
      default: "",
    }),
    label: "Example Derived When",
    title: "derived() builds a condition from more than one field",
  }),
  "example-if": ifParser({
    branches: [
      {
        condition: equals(["example-select"], "foo"),
        parser: textParser({
          label: "Shown When Select Is 'foo'",
          default: "",
        }),
      },
      {
        condition: equals(["example-checkbox"], true),
        parser: numberParser({
          label: "Shown When Checkbox Is Checked",
          default: 0,
          attrs: { min: "0", max: "10" },
        }),
      },
    ],
    otherwise: textParser({
      label: "Fallback",
      default: "Neither branch matched",
    }),
    label: "Example If",
    title: "First matching branch wins; falls back to otherwise",
  }),
  "example-array-when": when({
    condition: satisfies(
      ["example-table", 0, 1],
      (checked: boolean | undefined) => checked === true
    ),
    parser: textParser({
      label: "Only Shown When The First Table Row's Checkbox Is Checked",
      default: "",
    }),
    label: "Example Array When",
    title:
      "Depends on example-table[0][1] - a table row's own columns are a fixed-width tuple, but the row array itself is dynamic (rows can be added/removed), so this dependency's type must include '| undefined'",
  }),
});

export type Config =
  typeof config extends ResolvedParserObject<infer R> ? R : never;

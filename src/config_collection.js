class ConfigCollection {
  #cfgData;
  #fieldTypes;
  #shortUrl;
  #state;
  #onUpdateCallback;

  constructor(
    baseEl,
    cfgData,
    shortUrl,
    loadInpHtml,
    paramTypes,
    initialData,
    onUpdateCallback
  ) {
    this.#cfgData = cfgData;
    this.#shortUrl = shortUrl;
    this.#fieldTypes = cfgData.fields.map((field) => paramTypes[field.type]);
    this.#state = [];
    this.#onUpdateCallback = onUpdateCallback;

    const flatInitialData = initialData === "" ? [] : initialData?.split(",");
    const numFields = cfgData.fields.length;
    const initial = !flatInitialData
      ? null
      : new Array(Math.ceil(flatInitialData.length / numFields))
          .fill()
          .map((_, i) =>
            new Array(numFields)
              .fill()
              .map((_, j) => flatInitialData[i * numFields + j])
          );

    const html = this.#initHtml(initial, loadInpHtml);

    baseEl.append(html[0]);
    this.tag = html;
  }

  #makeRowHtml(rowItem, loadInpHtml) {
    const rowSelect = $('<td><input data-row-selector type="checkbox" /></td>');
    $(rowSelect.children()).change((evt) =>
      $(evt.currentTarget)
        .closest("tr")
        .toggleClass("selected", $(evt.currentTarget).is(":checked"))
    );
    const html = $("<tr></tr>").append(
      this.#cfgData.expandable ? rowSelect : "",
      this.#cfgData.fields.map((field, i) => {
        const td = $("<td></td>").append(loadInpHtml(field));
        const typeCfg = this.#fieldTypes[i];
        if (typeCfg.change) {
          const fieldChange = typeCfg.change(i, rowItem.fields);
          td.children().change((evt) => {
            fieldChange(evt);
            this.#onUpdateCallback(this.#cfgData.id);
          });
        }
        if (typeCfg.input) {
          const fieldChange = typeCfg.input(i, rowItem.fields);
          td.children().on("input", (evt) => {
            fieldChange(evt);
            this.#onUpdateCallback(this.#cfgData.id);
          });
        }
        return td;
      })
    )[0];

    this.#fieldTypes.forEach(
      (fieldType, i) =>
        rowItem.fields[i] === undefined ||
        fieldType.setVal(
          $(html.children[i + this.#cfgData.expandable].children[0]),
          rowItem.fields[i].val
        )
    );

    return html;
  }

  #initHtml(initialOverride, loadInpHtml) {
    const html = $(`
      <div class="collection">
        <a class="config-item text-decoration-none text-white collapsed d-flex justify-content-between"
          data-toggle="collapse" href="#${this.#cfgData.id}">
          <span>${this.#cfgData.label}</span>
          <span class="collection-caret"></span>
        </a>
        <div class="collapse config-item table-responsive" id="${
          this.#cfgData.id
        }">
          <table class="table table-sm table-dark text-light table-hover">
            <thead>
              <tr>
                ${this.#cfgData.expandable ? '<th scope="col"></th>' : ""}
                ${this.#cfgData.fields
                  .map((field) => '<th scope="col">' + field.label + "</th>")
                  .join("")}
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          ${
            this.#cfgData.expandable
              ? `<div class="d-flex justify-content-between collection-footer">
                <button class="btn btn-sm btn-warning float-right" data-action="delete">Delete Selected</button>
                <button class="btn btn-sm btn-primary float-right" data-action="add">Add Row</button>
              </div>`
              : ""
          }
        </div>
      </div>`);

    html.find("[data-action=delete]").click(() => {
      this.#state = this.#state.filter(
        (rowItem) => $("tr.selected").index(rowItem.rowEl) === -1
      );
      $("tr.selected").remove();
    });
    html.find("[data-action=add]").click((evt) => {
      const rowItem = {
        fields: this.#cfgData.fields.map((field) => ({ val: field.initial })),
      };
      this.#state.push(rowItem);
      rowItem.rowEl = this.#makeRowHtml(rowItem, loadInpHtml);
      $(evt.currentTarget)
        .closest(".collection")
        .find("tbody")
        .append(rowItem.rowEl);
    });

    const rowHtmlOutput = html.find("tbody");
    for (let i in initialOverride ?? this.#cfgData.default) {
      let initial;
      const rowItem = {
        fields: this.#cfgData.default[i].map((val, j) => ({
          val: (initial = initialOverride?.[i]?.[j])
            ? this.#fieldTypes[j].deserialise(initial, this.#shortUrl)
            : val,
        })),
      };
      this.#state.push(rowItem);
      rowItem.rowEl = this.#makeRowHtml(rowItem, loadInpHtml);
      rowHtmlOutput.append(rowItem.rowEl);
    }
    return html;
  }

  get val() {
    return this.#state.map((row) => row.fields.map((field) => field.val));
  }

  serialise() {
    return this.#state
      .map((row) =>
        row.fields
          .map((_, i) =>
            this.#fieldTypes[i].serialise(
              $(row.rowEl.children[i + this.#cfgData.expandable].children[0]),
              this.#shortUrl
            )
          )
          .join(",")
      )
      .join(",");
  }
}

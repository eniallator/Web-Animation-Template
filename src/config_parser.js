const numberParam = {
  serialise: (tag) => String(tag.val()),
  deserialise: Number,
  setVal: (tag, val) => tag.val(val),
  change: (key, stateObj) => (evt) => {
    stateObj[key].val = +$(evt.target).val();
  },
};

const paramTypes = {
  checkbox: {
    serialise: (tag) => String(tag.prop("checked")),
    deserialise: (val) => val.toLowerCase() === "true",
    setVal: (tag, val) => {
      tag.prop("checked", val);
    },
    change: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).is(":checked");
    },
  },
  number: { ...numberParam },
  range: { ...numberParam },
  button: {
    clickable: true,
  },
  color: {
    serialise: (tag) => String(tag.val().substr(1).toUpperCase()),
    deserialise: (val) => val.toUpperCase(),
    setVal: (tag, val) => {
      tag.val("#" + val);
    },
    input: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).val().substr(1).toUpperCase();
    },
  },
};

class ParamConfig {
  constructor(configLocation, rawUrlParams, baseEl) {
    this.state = {};
    this.listeners = [];
    this.updates = [];
    const initialValues = this.parseUrlParams(rawUrlParams);

    fetch(configLocation)
      .then((resp) => resp.json())
      .then((parameterConfig) =>
        this.#loadConfigHtml(baseEl, parameterConfig, initialValues)
      )
      .catch((err) => console.error(err));
  }

  #loadConfigHtml(baseEl, parameterConfig, initialValues) {
    for (let cfgData of parameterConfig) {
      let inpTag;
      if (cfgData.type === "button") {
        inpTag = $(document.createElement("button")).addClass("btn btn-info");
        inpTag.text(cfgData.text);
      } else {
        inpTag = $(document.createElement("input")).attr("type", cfgData.type);
      }
      inpTag.attr("id", cfgData.id);
      if (cfgData.attrs) {
        for (let attr in cfgData.attrs) {
          inpTag.attr(attr, cfgData.attrs[attr]);
        }
      }
      const label = $(document.createElement("label"))
        .attr("for", cfgData.id)
        .text(cfgData.label);
      if (cfgData.tooltip) {
        label
          .attr("data-toggle", "tooltip")
          .attr("data-placement", "top")
          .attr("title", cfgData.tooltip)
          .tooltip();
      }
      baseEl.append(
        $(document.createElement("div"))
          .addClass("config-item")
          .append(cfgData.label ? label : "", inpTag)
      );

      const typeCfg = paramTypes[cfgData.type];
      this.state[cfgData.id] = {
        tag: inpTag,
        serialise: typeCfg.serialise,
        default: cfgData.default,
      };
      if (typeCfg.change) {
        const inpTagChange = typeCfg.change(cfgData.id, this.state);
        inpTag.change((evt) => {
          this.updates.push(cfgData.id);
          inpTagChange(evt);
          this.tellListeners();
        });
      }
      if (typeCfg.input) {
        const inpTagChange = typeCfg.input(cfgData.id, this.state);
        inpTag.on("input", (evt) => {
          this.updates.push(cfgData.id);
          inpTagChange(evt);
          this.tellListeners();
        });
      }
      if (typeCfg.clickable) {
        inpTag.click(() => {
          this.state[cfgData.id].clicked = true;
          this.tellListeners();
        });
      }

      if (typeCfg.setVal) {
        typeCfg.setVal(
          inpTag,
          initialValues[cfgData.id] !== undefined
            ? typeCfg.deserialise(initialValues[cfgData.id])
            : cfgData.default
        );
      }
      inpTag.trigger("change");
      inpTag.trigger("input");
    }
    this.loaded = true;
    if (this.loadListener) {
      this.loadListener(this);
    }
  }

  onLoad(listener) {
    if (this.loaded) {
      listener(this);
    } else {
      this.loadListener = listener;
    }
  }

  addListener(listener, updateSubscriptions = undefined) {
    const cleanedUpdates = (
      updateSubscriptions || Object.keys(this.state)
    ).filter((update) => this.state[update] !== undefined);

    this.listeners.push({ listener: listener, updates: cleanedUpdates });
    this.tellListeners();
  }

  tellListeners(force = false) {
    if (!force && this.updates === []) {
      return;
    }

    this.listeners.forEach((item) => {
      let relevantUpdates = item.updates.filter((update) =>
        this.updates.includes(update)
      );

      if (force || relevantUpdates.length > 0) {
        const stateCopy = {};
        for (let key in this.state) {
          stateCopy[key] = this.state[key].val;
        }

        item.listener(stateCopy, relevantUpdates);
      }
    });

    this.updates = [];
  }

  parseUrlParams(rawUrlParams) {
    const paramRegex = /[?&]?([^=]+)=([^&]*)/g;
    const parsed = {};
    let tokens;
    while ((tokens = paramRegex.exec(rawUrlParams))) {
      parsed[tokens[1]] = tokens[2];
    }
    return parsed;
  }

  getVal(id) {
    return this.state[id].val;
  }

  clicked(id) {
    if (!this.state[id].clicked) return false;
    this.state[id].clicked = false;
    return true;
  }

  serialiseToURLParams() {
    let params = "";
    for (let key in this.state) {
      if (
        this.state[key].default === this.state[key].val ||
        this.state[key].serialise === undefined
      ) {
        continue;
      }

      if (params !== "") {
        params += "&";
      }
      params += key + "=" + this.state[key].serialise(this.state[key].tag);
    }
    return params;
  }

  addCopyToClipboardHandler(selector) {
    new ClipboardJS(selector, {
      text: (trigger) => {
        return (
          location.protocol +
          "//" +
          location.host +
          location.pathname +
          "?" +
          this.serialiseToURLParams()
        );
      },
    }).on("success", (evt) => alert("Copied share link to clipboard"));
  }
}

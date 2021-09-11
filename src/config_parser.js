const numberParam = {
  serialise: (tag) => String(tag.val()),
  deserialise: Number,
  setVal: (tag, val) => tag.val(val),
  change: (key, stateObj) => (evt) => {
    stateObj[key].val = +$(evt.target).val();
  },
};

const BASE64CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
function intToBase64(n) {
  let base64Str = "";
  while (n) {
    base64Str = BASE64CHARS[((n % 64) + 64) % 64] + base64Str;
    n = n > 0 ? Math.floor(n / 64) : Math.ceil(n / 64);
  }
  return base64Str;
}

function base64ToPosInt(str) {
  let n = 0;
  for (let char of str) {
    n = n * 64 + BASE64CHARS.indexOf(char);
  }
  return n;
}

const paramTypes = {
  checkbox: {
    serialise: (tag, shortUrl) =>
      String(shortUrl ? +tag.prop("checked") : tag.prop("checked")),
    deserialise: (val, shortUrl) =>
      val.toLowerCase() === (shortUrl ? "1" : "true"),
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
    serialise: (tag, shortUrl) => {
      const col = String(tag.val().substr(1).toUpperCase());
      if (shortUrl) return intToBase64(parseInt(col, 16));
      return col;
    },
    deserialise: (val, shortUrl) => {
      if (shortUrl) return base64ToPosInt(val).toString(16);
      return val.toUpperCase();
    },
    setVal: (tag, val) => {
      tag.val("#" + val);
    },
    input: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).val().substr(1).toUpperCase();
    },
  },
  text: {
    serialise: (tag) => escape(tag.val()),
    deserialise: (val) => unescape(val),
    setVal: (tag, val) => tag.val(val),
    change: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).val();
    },
  },
};

class ParamConfig {
  #shortUrl;
  #state;
  #initialValues;
  #listeners;
  #updates;
  #loadListener;
  #loaded;

  get loaded() {
    return this.#loaded;
  }
  get extra() {
    return this.#shortUrl ? this.#initialValues.e : this.#initialValues.extra;
  }

  constructor(configLocation, baseEl, shortUrl = false) {
    this.#state = {};
    this.#listeners = [];
    this.#updates = [];
    this.#initialValues = this.parseUrlParams(document.location.search);
    this.#shortUrl = shortUrl;

    fetch(configLocation)
      .then((resp) => resp.json())
      .then((parameterConfig) => this.#loadConfigHtml(baseEl, parameterConfig))
      .catch((err) => console.error(err));
  }

  // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  #hashString(str) {
    let hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  #loadConfigHtml(baseEl, parameterConfig) {
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
      this.#state[cfgData.id] = {
        tag: inpTag,
        serialise: typeCfg.serialise,
        default: cfgData.default,
      };
      if (typeCfg.change) {
        const inpTagChange = typeCfg.change(cfgData.id, this.#state);
        inpTag.change((evt) => {
          this.#updates.push(cfgData.id);
          inpTagChange(evt);
          this.tellListeners();
        });
      }
      if (typeCfg.input) {
        const inpTagInput = typeCfg.input(cfgData.id, this.#state);
        inpTag.on("input", (evt) => {
          this.#updates.push(cfgData.id);
          inpTagInput(evt);
          this.tellListeners();
        });
      }
      if (typeCfg.clickable) {
        inpTag.click(() => {
          this.#state[cfgData.id].clicked = true;
          this.tellListeners();
        });
      }

      if (typeCfg.setVal) {
        const key = this.#shortUrl
          ? intToBase64(this.#hashString(cfgData.id))
          : cfgData.id;
        typeCfg.setVal(
          inpTag,
          this.#initialValues[key] !== undefined
            ? typeCfg.deserialise(this.#initialValues[key], this.#shortUrl)
            : cfgData.default
        );
      }
      inpTag.trigger("change");
      inpTag.trigger("input");
    }
    this.#loaded = true;
    if (this.#loadListener) {
      this.#loadListener(this);
    }
  }

  onLoad(listener) {
    if (this.#loaded) {
      listener(this);
    } else {
      this.#loadListener = listener;
    }
  }

  addListener(listener, updateSubscriptions = undefined) {
    const cleanedUpdates = (
      updateSubscriptions || Object.keys(this.#state)
    ).filter((update) => this.#state[update] !== undefined);

    this.#listeners.push({ listener: listener, updates: cleanedUpdates });
    this.tellListeners();
  }

  tellListeners(force = false) {
    if (!force && this.#updates === []) {
      return;
    }

    this.#listeners.forEach((item) => {
      let relevantUpdates = item.updates.filter((update) =>
        this.#updates.includes(update)
      );

      if (force || relevantUpdates.length > 0) {
        const stateCopy = {};
        for (let key in this.#state) {
          stateCopy[key] = this.#state[key].val;
        }

        item.listener(stateCopy, relevantUpdates);
      }
    });

    this.#updates = [];
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
    return this.#state[id].val;
  }

  clicked(id) {
    if (!this.#state[id].clicked) return false;
    this.#state[id].clicked = false;
    return true;
  }

  serialiseToURLParams(extra) {
    let params = "";
    for (let key in this.#state) {
      if (
        this.#state[key].default === this.#state[key].val ||
        this.#state[key].serialise === undefined
      ) {
        continue;
      }

      if (params !== "") {
        params += "&";
      }
      const paramKey = this.#shortUrl
        ? intToBase64(this.#hashString(key))
        : key;
      params +=
        paramKey +
        "=" +
        this.#state[key].serialise(this.#state[key].tag, this.#shortUrl);
    }
    if (extra) {
      if (params !== "") {
        params += "&";
      }
      params += (this.shortUrl ? "e=" : "extra=") + extra;
    }
    return params;
  }

  addCopyToClipboardHandler(selector, extraData) {
    const extraDataFunc =
      extraData !== undefined && typeof extraData !== "function"
        ? () => extraData
        : extraData;
    new ClipboardJS(selector, {
      text: (trigger) => {
        const stateCopy = {};
        if (extraDataFunc !== undefined) {
          for (let key in this.#state) {
            stateCopy[key] = this.#state[key].val;
          }
        }
        return (
          location.protocol +
          "//" +
          location.host +
          location.pathname +
          "?" +
          this.serialiseToURLParams(
            extraData !== undefined ? extraDataFunc(stateCopy) : null
          )
        );
      },
    }).on("success", (evt) => alert("Copied share link to clipboard"));
  }
}

const numberParam = {
  serialise: (tag) => String(tag.val()),
  deserialise: Number,
  setVal: (tag, val) => tag.val(val),
  change: (key, stateObj) => (evt) => {
    stateObj[key].val = +$(evt.target).val();
  },
};

const textParam = {
  serialise: (tag) => encodeURIComponent(tag.val()),
  deserialise: (val) => decodeURIComponent(val),
  setVal: (tag, val) => tag.val(val),
  change: (key, stateObj) => (evt) => {
    stateObj[key].val = $(evt.target).val();
  },
};

const BASE64CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
function intToBase64(n, length) {
  let base64Str = "";
  while (n) {
    base64Str = BASE64CHARS[((n % 64) + 64) % 64] + base64Str;
    n = n > 0 ? Math.floor(n / 64) : Math.ceil(n / 64);
  }
  return length != null
    ? "0".repeat(Math.max(length - base64Str.length, 0)) +
        base64Str.slice(Math.max(base64Str.length - length, 0))
    : base64Str;
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
      `${shortUrl ? +tag.prop("checked") : tag.prop("checked")}`,
    deserialise: (val, shortUrl) =>
      shortUrl ? val === "1" : val.toLowerCase() === "true",
    setVal: (tag, val) => {
      tag.prop("checked", val);
    },
    change: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).is(":checked");
    },
  },
  number: { ...numberParam },
  range: {
    ...numberParam,
    serialise: (tag, shortUrl, cfg) =>
      shortUrl
        ? intToBase64(
            Math.round(
              (Math.max(
                Math.min(tag.val(), cfg.attrs?.max ?? 100),
                cfg.attrs?.min ?? 0
              ) -
                (cfg.attrs?.min ?? 0)) /
                (cfg.attrs?.step ?? 1)
            )
          )
        : String(tag.val()),
    deserialise: (val, shortUrl, cfg) =>
      shortUrl
        ? (cfg.attrs?.min ?? 0) + base64ToPosInt(val) * (cfg.attrs?.step ?? 1)
        : Number(val),
  },
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
  text: textParam,
  select: textParam,
  ["datetime-local"]: {
    serialise: (tag, shortUrl) =>
      shortUrl
        ? intToBase64(
            Date.parse(tag.val()) / 60000 - new Date().getTimezoneOffset()
          )
        : encodeURIComponent(tag.val()),
    deserialise: (val, shortUrl) =>
      shortUrl
        ? new Date(base64ToPosInt(val) * 60000)
            .toLocaleString()
            .replace(
              /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
              "$<y>-$<m>-$<d>T$<t>"
            )
        : decodeURIComponent(val),
    setVal: (tag, val) => tag.val(val),
    change: (key, stateObj) => (evt) => {
      stateObj[key].val = $(evt.target).val();
    },
  },
  file: {
    change: (key, stateObj) => (evt) =>
      new Promise((res, rej) => {
        if (evt.target.files?.[0] != null) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            stateObj[key].val = evt.target.result;
            res();
          };
          reader.readAsDataURL(evt.target.files[0]);
        } else {
          res();
        }
      }),
  },
};

class ParamConfig {
  static #customTypeConfig = {};
  static #hashKeyLength = 6;
  #shortUrl;
  #state = {};
  #initialValues;
  #listeners = [];
  #updates = [];
  #loadCallback;
  #loaded = false;
  #unloadedSubscriptionListeners = [];

  /**
   * Config parsing to/from URL parameters and an interactive page element
   * @param {string} configLocation Path to the config json file
   * @param {HTMLElement} baseEl The element to put all the config HTML code
   * @param {boolean} [shortUrl=false] Whether to make the URLs short or not
   */
  constructor(configLocation, baseEl, shortUrl = false) {
    this.#initialValues = this.#parseUrlParams(location.search, shortUrl);
    this.#shortUrl = shortUrl;

    fetch(configLocation)
      .then((resp) => resp.json())
      .then((parameterConfig) => {
        for (let cfgData of parameterConfig) {
          if (cfgData.type == "collection") {
            const onUpdateCallback = (id) => {
              this.#updates.push(id);
              this.tellListeners();
            };
            const dataKey = this.#shortUrl
              ? intToBase64(
                  this.#hashString(cfgData.id),
                  ParamConfig.#hashKeyLength
                )
              : cfgData.id;
            this.#state[cfgData.id] = new ConfigCollection(
              baseEl,
              cfgData,
              shortUrl,
              this.#loadInpHTML,
              paramTypes,
              this.#initialValues[dataKey],
              onUpdateCallback
            );
          } else {
            this.#loadConfigHtml($(baseEl), cfgData);
          }
        }
        this.#loaded = true;
        this.#addSubscriptionListeners();
        if (this.#loadCallback) {
          this.#loadCallback(this);
        }
      })
      .catch((err) => console.error(err));
  }

  get loaded() {
    return this.#loaded;
  }
  get extra() {
    return this.#shortUrl ? this.#initialValues.e : this.#initialValues.extra;
  }

  /**
   * Add your own custom config type
   * @param {string} name Name of the type specified in the config under the `type` key
   * @param {{
   *  serialise :function(HTMLElement, boolean): string,
   *  deserialise :function(any, boolean): string,
   *  setVal: function(HTMLElement, boolean): void,
   *  input?: function(string, object): function(HTMLInputEvent): void | Promise,
   *  change?: function(string, object): function(HTMLChangeEvent): void | Promise,
   *  clickable?: boolean
   * }} config The type's config
   *
   * EXAMPLE:
   * ```
      ParamConfig.addCustomType("text", {
        serialise: (tag) => escape(tag.val()),
        deserialise: (val) => unescape(val),
        setVal: (tag, val) => tag.val(val),
        change: (key, stateObj) => (evt) => {
          stateObj[key].val = $(evt.target).val();
        },
      })```
   */
  static addCustomType(name, config) {
    this.#customTypeConfig[name] = config;
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

  #loadInpHTML(cfgData) {
    let html, inp;
    if (cfgData.type === "button") {
      html = inp = $(document.createElement("button")).addClass("btn btn-info");
      inp.text(cfgData.text);
    } else if (cfgData.type === "select") {
      html = inp = $(document.createElement("select"))
        .addClass("form-select")
        .append(
          ...cfgData.options.map((option) =>
            $(document.createElement("option")).val(option).text(option)
          )
        );
      if (cfgData.default != null) {
        inp.val(cfgData.default);
      }
    } else if (cfgData.type === "file") {
      inp = $(document.createElement("input")).attr("type", "file").hide();
      const btn = $(document.createElement("button"))
        .text(cfgData.text)
        .addClass("btn btn-secondary")
        .click(() => inp.click());
      html = $(document.createElement("div")).append(inp, btn);
    } else {
      html = inp = $(document.createElement("input")).attr(
        "type",
        cfgData.type
      );
    }
    if (cfgData.attrs) {
      for (let attr in cfgData.attrs) {
        inp.attr(attr, cfgData.attrs[attr]);
      }
    }
    return { html, inp };
  }

  #loadConfigHtml(baseEl, cfgData) {
    const { inp: inpTag, html: inpHtml } = this.#loadInpHTML(cfgData);
    inpTag.attr("id", cfgData.id);
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
        .append(cfgData.label ? label : "", inpHtml)
    );

    const typeCfg =
      ParamConfig.#customTypeConfig[cfgData.type] ?? paramTypes[cfgData.type];
    this.#state[cfgData.id] = {
      tag: inpTag,
      serialise: typeCfg.serialise,
      default: cfgData.default,
      cfg: cfgData,
    };
    if (typeCfg.change) {
      const inpTagChange = typeCfg.change(cfgData.id, this.#state);
      inpTag.change((evt) => {
        this.#updates.push(cfgData.id);
        const res = inpTagChange(evt);
        if (res?.then != null) {
          res.then(() => this.tellListeners.call(this));
        } else {
          this.tellListeners();
        }
      });
    }
    if (typeCfg.input) {
      const inpTagInput = typeCfg.input(cfgData.id, this.#state);
      inpTag.on("input", (evt) => {
        this.#updates.push(cfgData.id);
        const res = inpTagInput(evt);
        if (res?.then != null) {
          res.then(() => this.tellListeners.call(this));
        } else {
          this.tellListeners();
        }
      });
    }
    if (typeCfg.clickable) {
      inpTag.click(() => {
        this.#updates.push(cfgData.id);
        this.#state[cfgData.id].clicked = true;
        this.tellListeners();
      });
    }

    if (typeCfg.setVal) {
      const key = this.#shortUrl
        ? intToBase64(this.#hashString(cfgData.id), ParamConfig.#hashKeyLength)
        : cfgData.id;
      typeCfg.setVal(
        inpTag,
        this.#initialValues[key] != null
          ? typeCfg.deserialise(
              this.#initialValues[key],
              this.#shortUrl,
              cfgData
            )
          : cfgData.default
      );
    }
    inpTag.trigger("change");
    inpTag.trigger("input");
  }

  /**
   * Executes a function when the config has been loaded
   * @param {function(this):void} callbackFn Callback to execute when loaded
   */
  onLoad(callbackFn) {
    if (this.#loaded) {
      callbackFn(this);
    } else {
      this.#loadCallback = callbackFn;
    }
  }

  #addSubscriptionListeners() {
    if (!this.#loaded) return;
    for (let args of this.#unloadedSubscriptionListeners) {
      this.addListener(...args);
    }
  }

  /**
   * Adds an event listener to listen to when a config item changes
   * @param {function(Object.<string,any>, string[]):void} listener Listener function
   * @param {string[]} [updateSubscriptions] IDs of the config items to listen to. Defaults to all config items
   */
  addListener(listener, updateSubscriptions = undefined) {
    if (!this.#loaded && updateSubscriptions) {
      this.#unloadedSubscriptionListeners.push(arguments);
      return;
    }
    const cleanedUpdates =
      updateSubscriptions !== undefined &&
      (updateSubscriptions || Object.keys(this.#state)).filter(
        (update) => this.#state[update] !== undefined
      );

    this.#listeners.push({ listener: listener, updates: cleanedUpdates });
    this.tellListeners();
  }

  /**
   * Calls the listeners added with the ConfigParser.addListener method
   * @param {boolean} force Forces the calls to each listener
   */
  tellListeners(force = false) {
    if (!force && this.#updates.length === 0) {
      return;
    }

    this.#listeners.forEach((item) => {
      let relevantUpdates = item.updates
        ? item.updates.filter((update) => this.#updates.includes(update))
        : [...this.#updates];

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

  #parseUrlParams(rawUrlParams, shortUrl) {
    const paramRegex = shortUrl
      ? new RegExp(`[?&]?([^=&]{${ParamConfig.#hashKeyLength}})([^&]*)`, "g")
      : /[?&]?([^=&]+)=?([^&]*)/g;
    const parsed = {};
    let tokens;
    while ((tokens = paramRegex.exec(rawUrlParams))) {
      parsed[tokens[1]] = tokens[2];
    }
    return parsed;
  }

  /**
   * Gets the current value of a given config item ID
   * @param {string} id Config Item ID
   * @returns Current value of the config item
   */
  getVal(id) {
    return this.#state[id].val;
  }

  /**
   * Checks if a config button has been clicked or not.
   * @param {string} id ID of the config button type
   * @returns {boolean} If the config button was clicked since the last call
   */
  clicked(id) {
    if (!this.#state[id].clicked) return false;
    this.#state[id].clicked = false;
    return true;
  }

  /**
   * Serialises the current values of all config items. If a config item hasn't been changed from it's default, it is not included
   * @param {string} [extra] Extra data to also include. If falsy, it is not included.
   * @returns {string} Serialised URL parameters
   */
  serialiseToURLParams(extra) {
    let params = "";
    for (let key in this.#state) {
      if (
        (this.#state[key].compare &&
          this.#state[key].compare(
            this.#state[key].default,
            this.#state[key].val
          )) ||
        this.#state[key].default === this.#state[key].val ||
        this.#state[key].serialise === undefined
      ) {
        continue;
      }

      if (params !== "") {
        params += "&";
      }
      const paramKey = this.#shortUrl
        ? intToBase64(this.#hashString(key), ParamConfig.#hashKeyLength)
        : `${key}=`;
      params +=
        paramKey +
        this.#state[key].serialise(
          this.#state[key].tag,
          this.#shortUrl,
          this.#state[key].cfg
        );
    }
    if (extra) {
      if (params !== "") {
        params += "&";
      }
      params += (this.shortUrl ? "e=" : "extra=") + extra;
    }
    return params;
  }

  /**
   * Adds a copy to clipboard handler to a given element selector
   * @param {string} selector Selector of the share button in the format of querySelector selectors
   * @param {(any|function():string)} [extraData] If given a function, it is executed when the user clicks,
   *  and its return value added to the URL parameters. If it is not a function, it is included in the URL parameters.
   *  If the extra data is falsy, it is not included.
   */
  addCopyToClipboardHandler(selector, extraData) {
    const extraDataFunc =
      typeof extraData !== "function" ? () => extraData : extraData;

    $(selector)
      .data("toggle", "tooltip")
      .data("placement", "top")
      .data("trigger", "manual")
      .attr("title", "Copied!")
      .tooltip()
      .click((evt) => {
        const stateCopy = {};
        if (extraDataFunc !== undefined) {
          for (let key in this.#state) {
            stateCopy[key] = this.#state[key].val;
          }
        }
        const searchParams = this.serialiseToURLParams(
          extraData !== undefined ? extraDataFunc(stateCopy) : null
        );
        const sharableURL =
          location.protocol +
          "//" +
          location.host +
          location.pathname +
          (searchParams.length > 0 ? "?" + searchParams : "");
        if (location.href !== sharableURL) {
          history.pushState(null, "", sharableURL);
        }
        navigator.clipboard.writeText(sharableURL).then(() => {
          const copyBtn = $(evt.currentTarget);
          copyBtn.tooltip("show");
          setTimeout(() => copyBtn.tooltip("hide"), 1000);
        });
      });
  }
}

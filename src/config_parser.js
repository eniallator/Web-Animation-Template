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
  static #customTypeConfig = {};
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
    this.#initialValues = this.#parseUrlParams(location.search);
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
            this.#state[cfgData.id] = new ConfigCollection(
              baseEl,
              cfgData,
              shortUrl,
              this.#loadInpHTML,
              paramTypes,
              this.#initialValues[cfgData.id],
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
   * @param {{serialise:function(HTMLElement, boolean):string, deserialise:function(any, boolean):string, setVal:function(HTMLElement, boolean):void, input?: function(string, object):function(object):void, change?: function(string, object):function(object):void, clickable?: boolean}} config The type's config
   *
   * EXAMPLE:
   * ```ParamConfig.addCustomType("text", {
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
    let inpTag;
    if (cfgData.type === "button") {
      inpTag = $(document.createElement("button")).addClass("btn btn-info");
      inpTag.text(cfgData.text);
    } else {
      inpTag = $(document.createElement("input")).attr("type", cfgData.type);
    }
    if (cfgData.attrs) {
      for (let attr in cfgData.attrs) {
        inpTag.attr(attr, cfgData.attrs[attr]);
      }
    }
    return inpTag;
  }

  #loadConfigHtml(baseEl, cfgData) {
    const inpTag = this.#loadInpHTML(cfgData);
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
        .append(cfgData.label ? label : "", inpTag)
    );

    const typeCfg =
      ParamConfig.#customTypeConfig[cfgData.type] || paramTypes[cfgData.type];
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
        this.#updates.push(cfgData.id);
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

  #parseUrlParams(rawUrlParams) {
    const paramRegex = /[?&]?([^=&]+)=?([^&]*)/g;
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

  /**
   * Adds a copy to clipboard handler to a given element selector
   * @param {string} selector Selector of the share button in the format of querySelector selectors
   * @param {(any|function():string)} [extraData] If given a function, it is executed when the user clicks,
   *  and its return value added to the URL parameters. If it is not a function, it is included in the URL parameters.
   *  If the extra data is falsy, it is not included.
   */
  addCopyToClipboardHandler(selector, extraData) {
    const extraDataFunc =
      extraData !== undefined && typeof extraData !== "function"
        ? () => extraData
        : extraData;

    $(selector)
      .data("toggle", "tooltip")
      .data("placement", "top")
      .data("trigger", "manual")
      .attr("title", "Copied!")
      .click((evt) => {
        const stateCopy = {};
        if (extraDataFunc !== undefined) {
          for (let key in this.#state) {
            stateCopy[key] = this.#state[key].val;
          }
        }
        const textToCopy =
          location.protocol +
          "//" +
          location.host +
          location.pathname +
          "?" +
          this.serialiseToURLParams(
            extraData !== undefined ? extraDataFunc(stateCopy) : null
          );
        const el = $(`<textarea>${textToCopy}</textarea>`);
        $(document.body).append(el);
        el.focus().select();
        document.execCommand("copy");
        el.remove();

        const copyBtn = $(evt.currentTarget);
        copyBtn.tooltip("show");
        setTimeout(() => copyBtn.tooltip("hide"), 1000);
      });
  }
}

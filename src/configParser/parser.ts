import { intToBase64 } from "./parse";
import { ConfigPart } from "./types";

type State = Record<string, string>;

export default class ParamConfig {
  private static hashKeyLength: number = 6;
  private shortUrl: boolean;
  private state: State = {};
  private initialValues;
  private listeners = [];
  private updates: Array<string> = [];
  private loadCallback?: (this: ThisType<ParamConfig>) => void;
  private _loaded: boolean = false;
  private unloadedSubscriptionListeners = [];

  /**
   * Config parsing to/from URL parameters and an interactive page element
   * @param {string} configLocation Path to the config json file
   * @param {HTMLElement} baseEl The element to put all the config HTML code
   * @param {boolean} [shortUrl=false] Whether to make the URLs short or not
   */
  constructor(
    config: Array<ConfigPart>,
    baseEl: HTMLElement,
    shortUrl: boolean = false
  ) {
    this.initialValues = this.parseUrlParams(location.search, shortUrl);
    this.shortUrl = shortUrl;

    for (let cfgData of config) {
      if (cfgData.type == "Collection") {
        const onUpdateCallback = (id: string) => {
          this.updates.push(id);
          this.tellListeners();
        };
        const dataKey = this.shortUrl
          ? intToBase64(this.hashString(cfgData.id), ParamConfig.hashKeyLength)
          : cfgData.id;
        this.state[cfgData.id] = new ConfigCollection(
          baseEl,
          cfgData,
          shortUrl,
          this.loadInpHTML,
          this.initialValues[dataKey],
          onUpdateCallback
        );
      } else {
        this.loadConfigHtml(baseEl, cfgData);
      }
    }
    this._loaded = true;
    this.addSubscriptionListeners();
    if (this.loadCallback) {
      this.loadCallback(this);
    }
  }

  get loaded() {
    return this._loaded;
  }
  get extra() {
    return this.shortUrl ? this.initialValues.e : this.initialValues.extra;
  }

  // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  private hashString(str: string): number {
    let hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  private loadInpHTML(cfgData: Config): {
    html: HTMLElement;
    inp: HTMLElement;
  } {
    const setAttributes = (inp: HTMLElement): HTMLElement => {
      if (cfgData.attrs) {
        for (let attr in cfgData.attrs) {
          inp.setAttribute(attr, cfgData.attrs[attr]);
        }
      }
      return inp;
    };
    if (cfgData.type === "button") {
      const html = document.createElement("button");
      html.className = "btn btn-info";
      const inp = html;
      inp.innerText = cfgData.text ?? "";
      return { inp: setAttributes(inp), html };
    } else if (cfgData.type === "select") {
      const html = document.createElement("select");
      const inp = html;
      html.className = "form-select";

      cfgData.options?.forEach((option) => {
        const el = document.createElement("option");
        el.value = option;
        el.innerText = option;
        inp.appendChild(el);
      });

      if (cfgData.default != null) {
        inp.value = cfgData.default as string;
      }
      return { inp: setAttributes(inp), html };
    } else if (cfgData.type === "file") {
      const inp = document.createElement("input");
      inp.setAttribute("type", "file");
      inp.style.display = "none";

      const btn = document.createElement("button");
      btn.innerText = cfgData.text ?? "";
      btn.className = "btn btn-secondary";
      btn.onclick = () => inp.click();

      const html = document.createElement("div");
      html.appendChild(inp);
      html.appendChild(btn);

      return { inp: setAttributes(inp), html };
    } else {
      const html = document.createElement("input");
      const inp = html;
      html.setAttribute("type", cfgData.type);
      return { inp: setAttributes(inp), html };
    }
  }

  loadConfigHtml(baseEl: HTMLElement, cfgData: Config) {
    const { inp: inpTag, html: inpHtml } = this.loadInpHTML(cfgData);
    inpTag.setAttribute("id", cfgData.id);
    if (cfgData.label != null) {
      const label = document.createElement("label");
      label.setAttribute("for", cfgData.id);
      label.innerText = cfgData.label;
      if (cfgData.tooltip != null) {
        label.setAttribute("data-toggle", "tooltip");
        label.setAttribute("data-placement", "top");
        label.setAttribute("title", cfgData.tooltip).tooltip();
      }
      baseEl.append(
        document
          .createElement("div")
          .addClass("config-item")
          .append(cfgData.label ? label : "", inpHtml)
      );
    }

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

  addSubscriptionListeners() {
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

  private parseUrlParams(
    rawUrlParams: string,
    shortUrl: boolean
  ): Record<string, string> {
    const paramRegex = shortUrl
      ? new RegExp(`[?&]?([^=&]{${ParamConfig.hashKeyLength}})([^&]*)`, "g")
      : /[?&]?([^=&]+)=?([^&]*)/g;
    const parsed: Record<string, string> = {};
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
        this.#state[key].compare?.(
          this.#state[key].default,
          this.#state[key].val
        ) ||
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

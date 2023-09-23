import { intToBase64 } from "../core/b64";
import { isEqual, isString } from "../core/utils";
import { DeriveId, NarrowedState, PassedState, State } from "./derive";
import { initStateItem } from "./init";
import { isSerialisable, serialise } from "./serialise";
import { CompleteConfig, ConfigPart, StateItem } from "./types";

export default class ParamConfig<S extends State<ConfigPart<string>>> {
  private static hashKeyLength: number = 6;
  private shortUrl: boolean;
  private state: S;
  private initialValues: Record<string, string>;
  private listeners: Array<{
    listener: (
      passedState: PassedState<S>,
      updates: Array<DeriveId<S>>
    ) => void;
    subscriptions: Array<DeriveId<S>> | null;
  }> = [];
  private updates: Array<DeriveId<S>> = [];

  /**
   * Config parsing to/from URL parameters and an interactive page element
   * @param {string} configLocation Path to the config json file
   * @param {HTMLElement} baseEl The element to put all the config HTML code
   * @param {boolean} [shortUrl=false] Whether to make the URLs short or not
   */
  constructor(
    state: S,
    // configs: CompleteConfig<C>,
    shortUrl: boolean = false,
    initial: string = location.search
  ) {
    this.initialValues = this.parseUrlParams(initial, shortUrl);
    this.shortUrl = shortUrl;
    this.state = state;

    // const workingState: Partial<State<C>> = {};

    // for (let config of configs) {
    //   workingState[config.id] = initStateItem(
    //     baseEl,
    //     config,
    //     this.initialValues[this.urlKey(config.id)] ?? null,
    //     this.shortUrl,
    //     () => this.state[config.id].value,
    //     (value) => {
    //       this.state[config.id].value = value;
    //       this.updates.push(config.id);
    //       this.tellListeners();
    //     },
    //     () => {
    //       this.state[config.id].clicked = true;
    //       this.updates.push(config.id);
    //       this.tellListeners();
    //     }
    //   );
    // }

    // this.state = workingState as State<C>;
  }

  get extra() {
    return this.initialValues[this.urlKey("extra")];
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

  private urlKey(key: string): string {
    return this.shortUrl
      ? intToBase64(this.hashString(key), ParamConfig.hashKeyLength)
      : key;
  }

  /**
   * Adds an event listener to listen to when a config item changes
   * @param {function(PassedState, string[]):void} listener Listener function
   * @param {string[]} [updateSubscriptions] IDs of the config items to listen to. Defaults to all config items
   */
  addListener(
    listener: (state: PassedState<S>, updates: Array<DeriveId<S>>) => void,
    updateSubscriptions?: Array<DeriveId<S>>
  ): void {
    const subscriptions =
      updateSubscriptions != null
        ? (updateSubscriptions || Object.keys(this.state)).filter(
            (update) => this.state[update] !== undefined
          )
        : null;

    this.listeners.push({ listener, subscriptions });
    this.tellListeners();
  }

  /**
   * Calls the listeners added with the ConfigParser.addListener method
   * @param {boolean} force Forces the calls to each listener
   */
  tellListeners(force: boolean = false): void {
    if (!force && this.updates.length === 0) {
      return;
    }

    for (const { listener, subscriptions } of this.listeners) {
      let relevantSubscriptions =
        subscriptions != null
          ? subscriptions.filter((update) => this.updates.includes(update))
          : [...this.updates];

      if (force || relevantSubscriptions.length > 0) {
        const passedState = (
          Object.keys(this.state) as Array<DeriveId<S>>
        ).reduce(
          (acc, key) => ({
            ...acc,
            [key]: this.getVal(key),
          }),
          {} as PassedState<S>
        );

        listener(passedState, relevantSubscriptions);
      }
    }

    this.updates = [];
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
  getVal<const K extends DeriveId<S>>(id: K): S[K]["value"] {
    return this.state[id].value;
    // if (this.state[id] != null) {
    //   return this.state[id].value as S[K]["value"];
    // } else {
    //   throw new Error(`Unknown state ID: ${id}`);
    // }
  }

  /**
   * Checks if a config button has been clicked or not.
   * @param {string} id ID of the config button type
   * @returns {boolean} If the config button was clicked since the last call
   */
  clicked<const K extends DeriveId<S>>(id: K): boolean {
    return this.state[id].clicked;
    // const item = this.state[id];
    // if (item != null) {
    //   if (item.type === "Atom") {
    //     const { clicked } = item;
    //     item.clicked = false;
    //     return clicked;
    //   } else {
    //     return false;
    //   }
    // } else {
    //   throw new Error(`Unknown state ID: ${id}`);
    // }
  }

  /**
   * Serialises the current values of all config items. If a config item hasn't been changed from it's default, it is not included
   * @param {string} [extra] Extra data to also include. If falsy, it is not included.
   * @returns {string} Serialised URL parameters
   */
  serialiseToURLParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      [this.urlKey(key), value].join(this.shortUrl ? "" : "=");
    let params: Array<string> = Object.entries<StateItem<C>>(this.state)
      .map(([key, item]) => {
        if (
          isSerialisable(item.config) &&
          !isEqual<typeof item.value>(item.config.default, item.value)
        ) {
          return urlPart(key, serialise(item, this.shortUrl));
        } else {
          return null;
        }
      })
      .filter(isString);

    return (extra != null ? [...params, urlPart("extra", extra)] : params).join(
      "&"
    );
  }

  /**
   * Adds a copy to clipboard handler to a given element selector
   * @param {string} selector Selector of the share button in the format of querySelector selectors
   * @param {(any|function(state: PassedState<S>):string)} [extraData] If given a function, it is executed when the user clicks,
   *  and its return value added to the URL parameters. If it is not a function, it is included in the URL parameters.
   */
  addCopyToClipboardHandler(
    selector: string,
    extraData?: ((state: PassedState<S>) => string) | string
  ) {
    const extraDataFunc =
      typeof extraData !== "function" ? () => extraData : extraData;

    const el = document.querySelector(selector);

    if (el != null) {
      (el as HTMLElement).onclick = (_evt) => {
        const passedState: PassedState<S> = {};
        if (extraDataFunc !== undefined) {
          for (let key in this.state) {
            passedState[key] = this.state[key].value;
          }
        }
        const searchParams = this.serialiseToURLParams(
          extraDataFunc?.(passedState)
        );
        const sharableURL =
          location.protocol +
          "//" +
          location.host +
          location.pathname +
          (searchParams.length > 0 ? "?" + searchParams : "");
        navigator.clipboard.writeText(sharableURL);
      };
    }
    // $(selector)
    //   .data("toggle", "tooltip")
    //   .data("placement", "top")
    //   .data("trigger", "manual")
    //   .attr("title", "Copied!")
    //   .tooltip()
    //   .click((evt) => {
    //     if (location.href !== sharableURL) {
    //       history.pushState(null, "", sharableURL);
    //     }
    //     navigator.clipboard.writeText(sharableURL).then(() => {
    //       const copyBtn = $(evt.currentTarget);
    //       copyBtn.tooltip("show");
    //       setTimeout(() => copyBtn.tooltip("hide"), 1000);
    //     });
    //   });
  }

  static fromConfig<C extends ConfigPart<string>>(
    configs: CompleteConfig<C>,
    baseEl: HTMLElement
  ): ParamConfig<State<C>> {
    const state = configs.reduce(
      (workingState: State<C>, config) => ({
        ...workingState,
        [config.id]: initStateItem(
          baseEl,
          config,
          this.initialValues[this.urlKey(config.id)] ?? null,
          this.shortUrl,
          () => this.state[config.id].value,
          (value) => {
            this.state[config.id].value = value;
            this.updates.push(config.id);
            this.tellListeners();
          },
          () => {
            this.state[config.id].clicked = true;
            this.updates.push(config.id);
            this.tellListeners();
          }
        ),
      }),
      {} as State<C>
    );
  }
}

import { dom, formatDate, intToBase64, isEqual, isString } from "@web-art/core";
import { DeriveId, DeriveStateType, PassedState } from "./derive.js";
import { initStateItem } from "./init.js";
import { isSerialisableStateItem, serialise } from "./serialise.js";
import { ButtonConfig, ConfigPart, StateItem } from "./types.js";

export class ParamConfig<const C extends ConfigPart<string>> {
  private static hashKeyLength: number = 6;
  private shortUrl: boolean;
  private state: StateItem<C>[];
  private initialValues: Record<string, string>;
  private listeners: {
    listener: (passedState: PassedState<C>, updates: DeriveId<C>[]) => void;
    subscriptions: DeriveId<C>[] | null;
  }[] = [];
  private updates: DeriveId<C>[] = [];

  /**
   * Config parsing to/from URL parameters and an interactive page element
   * @param {string} configLocation Path to the config json file
   * @param {HTMLElement} baseEl The element to put all the config HTML code
   * @param {boolean} [shortUrl=false] Whether to make the URLs short or not
   */
  constructor(
    configs: readonly C[],
    baseEl: HTMLElement,
    shortUrl: boolean = false,
    initial: string = location.search
  ) {
    this.initialValues = this.parseUrlParams(initial, shortUrl);
    this.shortUrl = shortUrl;
    this.state = configs.map(config =>
      initStateItem(
        baseEl,
        config,
        this.initialValues[this.urlKey(config.id)] ?? null,
        this.shortUrl,
        () => this.typedStateItem(config.id).value as DeriveStateType<C>,
        value => {
          this.typedStateItem(config.id).value = value;
          this.updates.push(config.id);
          this.tellListeners();
        },
        () => {
          this.typedStateItem(config.id).clicked = true;
          this.updates.push(config.id);
          this.tellListeners();
        }
      )
    );
  }

  get extra() {
    return this.initialValues[this.urlKey("extra")];
  }

  private optTypedStateItem<const K extends DeriveId<C>>(
    id: K
  ): StateItem<Extract<C, ConfigPart<K>>> | null {
    const item = this.state.find(item => item.config.id === id) as
      | StateItem<Extract<C, ConfigPart<K>>>
      | undefined;
    return item ?? null;
  }

  private typedStateItem<const K extends DeriveId<C>>(id: K) {
    const item = this.optTypedStateItem(id);
    if (item != null) {
      return item;
    } else {
      throw new Error(`Unknown config ID: ${id}`);
    }
  }

  // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
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
    listener: (passedState: PassedState<C>, updates: DeriveId<C>[]) => void,
    updateSubscriptions?: DeriveId<C>[]
  ): void {
    const subscriptions =
      updateSubscriptions != null
        ? updateSubscriptions.filter(
            update => this.optTypedStateItem(update) != null
          )
        : null;

    this.listeners.push({ listener, subscriptions });
    this.tellListeners();
  }

  private createdPassedState(): PassedState<C> {
    return this.state.reduce<PassedState<C>>(
      (acc: PassedState<C>, item) => ({ ...acc, [item.config.id]: item.value }),
      {} as PassedState<C>
    );
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
      const relevantSubscriptions =
        subscriptions != null
          ? subscriptions.filter(update => this.updates.includes(update))
          : [...this.updates];

      if (force || relevantSubscriptions.length > 0) {
        listener(this.createdPassedState(), relevantSubscriptions);
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
      if (tokens[1] != null && tokens[2] != null) {
        parsed[tokens[1]] = decodeURIComponent(tokens[2]);
      }
    }
    return parsed;
  }

  /**
   * Gets the current value of a given config item ID
   * @param {string} id Config Item ID
   * @returns Current value of the config item
   */
  getVal<const K extends DeriveId<C>>(id: K) {
    return this.typedStateItem(id).value;
  }

  /**
   * Checks if a config button has been clicked or not.
   * @param {string} id ID of the config button type
   * @returns {boolean} If the config button was clicked since the last call
   */
  clicked<const K extends DeriveId<Extract<C, ButtonConfig<string>>>>(
    id: K
  ): boolean {
    return this.typedStateItem(id).clicked;
  }

  /**
   * Serialises the current values of all config items. If a config item hasn't been changed from it's default, it is not included
   * @param {string} [extra] Extra data to also include. If falsy, it is not included.
   * @returns {string} Serialised URL parameters
   */
  serialiseToURLParams(extra?: string): string {
    const urlPart = (key: string, value: string) =>
      [this.urlKey(key), value].join(this.shortUrl ? "" : "=");
    const params: string[] = this.state
      .map(item => {
        if (
          isSerialisableStateItem(item) &&
          (item.config.default == null ||
            (item.config.type === "Datetime"
              ? formatDate(item.config.default) !==
                formatDate(item.value as Date)
              : !isEqual<typeof item.value>(
                  item.config.default as typeof item.value,
                  item.value
                )))
        ) {
          const serialised = serialise(item, this.shortUrl);
          return serialised != null
            ? urlPart(item.config.id, serialised)
            : null;
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
   * @param {(function(state: PassedState<C>):string)} [extraData] If given a function, it is executed when the user clicks,
   *  and its return value added to the URL parameters. If it is not a function, it is included in the URL parameters.
   */
  addCopyToClipboardHandler(
    selector: string,
    extraData?: ((state: PassedState<C>) => string) | string
  ) {
    const extraDataFunc =
      typeof extraData !== "function" ? () => extraData : extraData;

    dom.addListener(dom.get(selector), "click", () => {
      const searchParams = this.serialiseToURLParams(
        extraDataFunc(this.createdPassedState())
      );
      const sharableURL =
        location.protocol +
        "//" +
        location.host +
        location.pathname +
        (searchParams.length > 0 ? "?" + searchParams : "");
      void navigator.clipboard.writeText(sharableURL);
    });
  }
}

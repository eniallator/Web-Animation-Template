import { raise } from "@web-art/core";

export const stringToHTML = (str: string): HTMLElement => {
  const el = document.createElement("template");
  el.innerHTML = str;
  return (el.children.item(0) ?? raise(Error("No nodes found"))) as HTMLElement;
};

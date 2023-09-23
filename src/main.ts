import ParamConfig from "./configParser";
import config from "./projectFiles/config";

const paramConfig = new ParamConfig(
  config,
  document.querySelector("#cfg-outer") as HTMLElement
);

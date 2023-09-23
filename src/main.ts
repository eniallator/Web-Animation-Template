import ParamConfig from "./configParser";
import config from "./projectFiles/config";

// const paramConfig = new ParamConfig(
//   config,
//   document.querySelector("#cfg-outer") as HTMLElement
// );

const paramConfig = ParamConfig.fromConfig(
  config,
  document.querySelector("#cfg-outer") as HTMLElement
);

const a = paramConfig.getVal("example-checkbox");
const b = paramConfig.getVal("example-collection");

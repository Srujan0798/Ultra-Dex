var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
let MockProvider = class {
  constructor(config = {}) {
    this.config = config;
    this.name = "mock";
  }
  async chat(messages, options = {}) {
    return {
      text: "Mock response from MockProvider",
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: options.model || "mock-model"
    };
  }
  async stream(messages, options = {}) {
    async function* generator() {
      yield { text: "Mock " };
      yield { text: "stream " };
      yield { text: "response" };
    }
    return generator();
  }
  async embed(text) {
    return new Array(1536).fill(0).map(() => Math.random());
  }
};
MockProvider = __decorateClass([
  singleton()
], MockProvider);
var mock_default = MockProvider;
export {
  MockProvider,
  mock_default as default
};

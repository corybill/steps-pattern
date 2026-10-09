import DefaultStrategy from "./default-strategy.js";
import DeleteStrategy from "./delete-strategy.js";
import GetUploadUrlStrategy from "./get-upload-url-strategy.js";

/**
 * Teaching fixture (after). Intent → Strategy map. DELETE is normalized
 * to "delete" by the Step before get().
 *
 * Not production. Distilled from strategies/save-account-document/index.js.
 */
const STRATEGIES = {
  delete: DeleteStrategy,
  "get-upload-url": GetUploadUrlStrategy,
};

export default {
  get(intent) {
    return STRATEGIES[intent] || DefaultStrategy;
  },
};

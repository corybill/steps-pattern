import Errr from "errr";

import SaveAccountDocumentStrategies from "../strategies/save-account-document/index.js";

/**
 * Teaching fixture (after). One Step maps DELETE / intent to a Strategy
 * and execute(state). The Service only accepts this Step.
 *
 * Not production. Distilled from save-account-document.js.
 */
class SaveAccountDocument {
  static async next(state) {
    try {
      const method = state.getUrlMethod?.() || "POST";
      const intent = method === "DELETE" ? "delete" : state.getIntent();
      const strategy = SaveAccountDocumentStrategies.get(intent);
      await strategy.execute(state);
    } catch (err) {
      Errr.newError("SaveAccountDocument step failed")
        .appendTo(err)
        .debug({ intent: state.getIntent(), method: state.getUrlMethod?.() })
        .throw();
    }
  }
}

export default SaveAccountDocument;

import Errr from "errr";

import DeleteAccountDocument from "../steps/delete-account-document.js";
import UploadAccountDocument from "../steps/upload-account-document.js";

/**
 * Teaching fixture (before). A Service that picks a write step with
 * if (method === "DELETE"). That IfStatement trips
 * enforce-service-orchestration.
 *
 * Not production. Distilled from the opposite of save-account-document.
 */
class PolicyService {
  static async saveDocument(state) {
    try {
      if (state.getUrlMethod() === "DELETE") {
        await state.accept(DeleteAccountDocument);
      } else {
        await state.accept(UploadAccountDocument);
      }
    } catch (err) {
      Errr.newError("Could not save account document.")
        .appendTo(err)
        .throw();
    }
  }
}

export default PolicyService;

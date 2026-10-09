/**
 * Teaching fixture (before). Route loader branches on registration
 * stage inside try and throws redirect. enforce-controller-orchestration
 * forbids IfStatement in the try body and forbids non-State
 * VariableDeclaration there.
 *
 * Not production. Distilled from registration.billing.jsx.
 */
export async function loader(args) {
  try {
    const userModel = args.context?.get?.(appUserModelContext);
    const registrationStage = userModel?.registrationStage || "PARTNER_PUBLIC";

    if (registrationStage === "PARTNER_PUBLIC") {
      throw redirect("/registration/partner");
    }

    if (registrationStage === "EXTENSION_INSTALL") {
      throw redirect("/registration/extension");
    }

    if (registrationStage === "PARTNER_PRIVATE") {
      throw redirect("/registration/partner-sign-in");
    }

    return {};
  } catch (err) {
    throw err;
  }
}

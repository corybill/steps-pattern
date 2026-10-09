/**
 * Teaching fixture (after). Module-level key → throw-redirect map.
 * Read the key outside try. One ReturnStatement inside try invokes
 * the mapped function (which throws redirect) or stays with {}.
 *
 * Not production. Distilled from registration.billing.jsx.
 */
const RedirectByRegistrationStage = {
  PARTNER_PUBLIC: () => {
    throw redirect("/registration/partner");
  },
  EXTENSION_INSTALL: () => {
    throw redirect("/registration/extension");
  },
  PARTNER_PRIVATE: () => {
    throw redirect("/registration/partner-sign-in");
  },
};

export async function loader(args) {
  const userModel = args.context?.get?.(appUserModelContext);
  const registrationStage = userModel?.registrationStage || "PARTNER_PUBLIC";

  try {
    return RedirectByRegistrationStage[registrationStage]?.() ?? {};
  } catch (err) {
    throw err;
  }
}

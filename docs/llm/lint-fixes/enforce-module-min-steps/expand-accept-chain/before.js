static async triggerPartnerSync(state) {
  try {
    await state.accept(TriggerAccountSync);
  } catch (err) {
    Errr.newError("PartnerModule.triggerPartnerSync failed").appendTo(err).throw();
  }
}

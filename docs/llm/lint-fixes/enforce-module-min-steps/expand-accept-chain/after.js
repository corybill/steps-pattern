static async jitTriggerPartnerSync(state) {
  try {
    await state.accept(TriggerJitPartnerSync);
    await state.accept(CallTriggerPartnerSyncIfNeeded);
  } catch (err) {
    Errr.newError("PartnerModule.jitTriggerPartnerSync failed").appendTo(err).throw();
  }
}

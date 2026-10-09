const MAX_SEARCH_DELAYED_RETRIES = 8;

if (typeof err?.get === "function" && err.get("isSearchWriteThrottled")) {
  if (searchRetryCount < MAX_SEARCH_DELAYED_RETRIES) {
    const retryAfterSeconds = Number(err.get("retryAfterSeconds")) || 0;
    const delaySeconds = computeDelayedRequeueSeconds({
      retryAfterSeconds,
      embedRetryCount: searchRetryCount,
      accountId,
      createdGt,
    });
  }
}

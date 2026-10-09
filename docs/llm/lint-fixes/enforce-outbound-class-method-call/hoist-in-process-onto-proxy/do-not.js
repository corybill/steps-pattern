// NEVER. This silences enforce-outbound-class-method-call and is not a fix.
// In-process policy is not outbound. Maddox lockdown then demands mocks for
// isSearchWriteThrottled / getMax* / computeDelayedRequeueSeconds.

import ModelProxy from "../proxies/model-proxy.js";
import SearchProxy from "../proxies/search-proxy.js";

if (SearchProxy.isSearchWriteThrottled(err)) {
  const maxRetries = SearchProxy.getMaxSearchDelayedRetries();
  const retryAfterSeconds = SearchProxy.getSearchRetryAfterSeconds(err);
  const delaySeconds = ModelProxy.computeDelayedRequeueSeconds({
    retryAfterSeconds,
    embedRetryCount: searchRetryCount,
    accountId,
    createdGt,
  });
}

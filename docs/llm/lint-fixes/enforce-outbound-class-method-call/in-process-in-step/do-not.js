// NEVER — hoist-in-process-onto-proxy. See that recipe.
if (SearchProxy.isSearchWriteThrottled(err)) {
  const delaySeconds = ModelProxy.computeDelayedRequeueSeconds(args);
}

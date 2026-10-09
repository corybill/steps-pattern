import { strategyForSourceKey } from "../strategies/generic-action-stale/index.js";

return keys.every((key) => strategyForSourceKey(key)?.isStale(key, facts) ?? false);

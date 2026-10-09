function isSourceKeyStale(key, facts) {
  if (key.startsWith("sale:")) { /* ... */ }
  if (key.startsWith("hold:")) { /* ... */ }
  if (key.startsWith("orphan:")) { /* ... */ }
  if (key.startsWith("fee:a:")) { /* ... */ }
  if (key.startsWith("fee:b:")) { /* ... */ }
  return false;
}

return keys.every((key) => isSourceKeyStale(key, facts));

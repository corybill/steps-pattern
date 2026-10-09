# remove-auth-gate

```xml
<meta>
  <rule-id>steps-pattern/enforce-no-route-auth-check</rule-id>
</meta>
```

Delete the `getAuth` / `userId` → 401 branch from the Remix `loader` / `action`. Auth short-circuit belongs in `rootAuthMiddleware` (`RequireAuthenticated`).

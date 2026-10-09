# Check 2: Remix Anti-Patterns

Remix relies on server-side rendering, progressive enhancement, and the web platform. Avoid standard SPA patterns that bypass these benefits.

## Anti-Patterns to Flag

1. **Client-Side Data Fetching / Mutations**:
   - *Avoid*: Using `useEffect` or client-side `fetch` / `axios` to load data or perform mutations on mount.
   - *Remix Way*: Use server-side `loader` functions and `useLoaderData` for reading data. Use server-side `action` functions with Remix `<Form>` or `useFetcher` for mutations.

2. **Client-Side State for Forms**:
   - *Avoid*: Managing complete form state with React `useState` and manually submitting via custom fetch handlers.
   - *Remix Way*: Use standard Remix `<Form>` or `useFetcher` to let Remix manage submission state, pending states, and automatic revalidation.

3. **Standard Anchor Tags or `window.location`**:
   - *Avoid*: Using standard `<a>` tags or `window.location.href` / `window.location.replace` for navigation.
   - *Remix Way*: Use Remix `<Link>`, `<NavLink>`, or `useNavigate()` to keep navigation within the SPA routing context.

4. **Duplicating URL State in React State**:
   - *Avoid*: Storing search queries, filters, or pagination in local React `useState` when they should be in the URL.
   - *Remix Way*: Use the URL query parameters as the single source of truth (`useSearchParams()`), updating them on change to trigger automatic Remix loader re-runs.

5. **Indirect Data Mapping**:
   - *Avoid*: Unpacking/mapping `loaderData` into many different variables or alternative representation schemas in the UI.
   - *Remix Way*: Map directly to properties of hydrated domain models at all levels (loader -> UI) to keep data mapping singular.

6. **Monolithic Component Files**:
   - *Avoid*: Creating massive, multi-thousand-line monolithic UI/component files.
   - *Remix Way*: Decompose complex features into small, understandable, self-contained components (and work up from there), even if not planned for reuse.

## Examples

### Remix Navigation

**Before (Standard Anchor Tag):**
```jsx
<a href="/accounts/123/settings" className="text-sm hover:underline">
  Account Settings
</a>
```

**After (Remix Link):**
```jsx
import { Link } from "@remix-run/react"

<Link to="/accounts/123/settings" className="text-sm hover:underline">
  Account Settings
</Link>
```

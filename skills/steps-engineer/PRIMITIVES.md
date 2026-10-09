# Check 1: Design System & Primitives Compliance

We strictly enforce our custom primitives (located in `app/front-end/primitives/`) over standard HTML elements to maintain design consistency, accessibility, focus states, and centralized maintenance.

## Rules
- Replace standard HTML tags with custom primitives:
  - `<button>` ➔ `<Button>`
  - `<input>` ➔ `<Input>`
  - `<textarea>` ➔ `<Textarea>`
  - `<select>` ➔ `<Select>`
  - `<label>` ➔ `<Label>`
  - `<dialog>` ➔ `<Dialog>`

## Exemptions
- Standard HTML elements are ONLY permitted for highly custom, non-standard interactive structures (e.g., custom list item dropdown triggers, custom table row triggers, or custom slider handles) where standard button/input styles would interfere and require excessive overrides.
- Any exemption must be justified and must not bypass global focus states or accessibility standards.

## Examples

### Button Refactoring

**Before (Standard HTML / Hardcoded Styles):**
```jsx
<button
  onClick={handleConfirm}
  className="rounded-lg py-2 text-xs font-bold bg-[#818cf8] text-[#1a0e02] hover:bg-indigo-400"
>
  Confirm Link
</button>
```

**After (Design System Compliant):**
```jsx
import { Button } from "@/front-end/primitives/button"

<Button
  onClick={handleConfirm}
  variant="default"
  className="flex-1 rounded-lg py-2 text-xs font-bold bg-[#818cf8] text-[#1a0e02] hover:bg-indigo-400"
>
  Confirm Link
</Button>
```

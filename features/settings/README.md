# Settings

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Settings page | `index.html` + `settings.js` | Sidebar → Settings. Display preferences (live) and Club setup. |
| Display | (in page) | Per-user preferences. Applied by `shared/shell.js` on every page (decision #35). |
| Club setup cards | (in page) | Key fob stock, Lead sources, Follow-up types, Lost reasons, Lead stages: **Coming soon** placeholders. |

## 2. Flow
- Click a preset → applies immediately (all pages, this session) → toast. "Reset to default" restores all presets.
- "Preview a profile" opens Aarav's profile drawer to check the drawer width.
- How it works: `App.setPref(key, value)` stores the choice and sets `data-drawer`, `data-density`, `data-text`, `data-search` on `<html>`; `tokens.css` switches token values for each preset. Pages need no changes.
- Sidebar default: used when the page loads, unless the sidebar was toggled this session. Changing it applies right away on desktop.

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Drawer width | preset | Yes | — | 70% | 60% / 70% / 80% / 92%. Tablet always ≥ 92%. |
| Density | preset | Yes | — | Comfortable | Compact / Comfortable / Spacious (switches the spacing tokens). |
| Text size | preset | Yes | — | Medium | Small / Medium / Large (switches the font-size tokens). |
| Search bar width | preset | Yes | — | Medium | Narrow 300px / Medium 440px / Wide 580px; expands +220px when open. |
| Sidebar default | preset | Yes | — | Expanded | Expanded / Collapsed (desktop). Tablet always starts collapsed. |

Storage: session storage key `mock.prefs` in the mockup; per-user settings in the real app.

## 4. States
- **Normal**: current preset highlighted (colour + "(default)" label on the default option).
- **Success**: toast after each change and after reset.
- **Empty / loading / error**: not applicable (local presets). Club setup sections show "Coming soon".

## 5. Status
Display: Ready for review. Club setup: Draft (coming soon).

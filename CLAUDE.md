# Mockup agent rules

## Role
- You ONLY build clickable HTML/CSS mockups with dummy data. No backend, no API,
  no frameworks, no build tools, no npm.
- Another team builds the real app (.NET Core API + React/TypeScript) from
  these mockups. Your README field tables are their spec.
- Stay inside this folder. Never read, copy or reference any other codebase.
- docs/ is the source of truth. If a request conflicts with docs/, ask first.

## Tech
- Plain HTML + CSS + small vanilla JS only (drawers, modals, tabs, filters,
  switchers, rendering dummy data). No external libraries or CDNs.
- Every page links shared/tokens.css, shared/styles.css, shared/app.js,
  shared/data.js. No inline colors or fonts; tokens only, so the theme can
  later be changed live from settings.
- Every page opens by double-click in a browser (relative paths only).

## Screen sizes
- Desktop (1280px+) and tablet (768–1024px) only. No mobile layouts.
- Tablet: sidebar collapses to icons; wide tables scroll inside their own box.

## Design principles
- List-first: the user stays on the list. Opening a record opens a side
  DRAWER; small actions open MODALS. Avoid full page changes.
- One profile for one person. Badge shows Lead or Client. Lead shows 4 tabs
  (Timeline, Tasks, Details, Docs); a Client adds Membership.
- Every profile shows a NEXT STEP box at the top: green = follow-up scheduled,
  amber = due today, red = overdue or no follow-up set. Client: days left on
  membership.
- Timeline is human language ("Priya called · Interested · next call Fri"),
  never technical logs.
- Status always = color + plain words, never color alone.
- Empty values show "—" or "Not set yet". Never "Jan 0001", "null",
  "[object Object]".
- Row actions: max 3 visible; the rest live inside the profile.
- Simple, calm, easy to train. If in doubt, fewer fields and fewer clicks.

## Dummy data
- Use ONLY shared/data.js so names and numbers match on every screen.
- Indian names, fake mobiles in +91 format (e.g. +91 90000 01234), fake
  emails at example.com. 3 branches, 8 roles (see docs/app-brief.md).
- Include edge cases: overdue lead, lead with no follow-up, lost lead,
  re-opened lead, free trial lead, paid trial client, paid member, duplicate
  mobile attempt, lead synced from Meta.

## Each feature README.md must contain
1. Screens in this feature and what each is for
2. Flow: which screen/drawer/modal opens from where
3. Field table: Field | Type | Required | Unique | Default | Notes
4. States: empty, loading, error, success
5. Status: Draft / Ready for review / Final

## Workflow
- One screen at a time. Before building, reply with a short plan
  (what, which fields, which states) and wait for "yes".
- After building: update the feature README and index.html, then report
  what you made and what you assumed.
- Never invent business rules. If docs/ does not answer it, ask.

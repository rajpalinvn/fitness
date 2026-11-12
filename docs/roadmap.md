# Roadmap

Screens in the mockup. Status per screen lives in `index.html` and each
feature README. Rules: `docs/decisions.md`. Questions: `docs/open-questions.md`.

## Done (Ready for review)
- App shell: sidebar with badges, top bar, inline search box, "View as" role, branch switcher, Display preferences.
- Today: overdue or not set, due today, my tasks, unassigned leads, clients with pending items.
- Leads list: pipeline cards, filters, Needs attention.
- Clients list: cards (Needs attention, Active, Renewal due, Expired, Paid trial), ends-on, PT, balance, pending, Collect payment.
- Profile drawer: Timeline, Tasks, Details, Docs, Membership, NEXT STEP, pending items, linkable URLs.
- Follow-ups: add, log outcome, cancel, Closed by system, lost, re-open, assign.
- Convert to Client: Sell mode in the drawer (details, package, sale & start, key fob, summary).
- Settings: Display, Packages, Items & stock (items, accessory stock, key fobs, tax categories).
- Test runner: `bash tools/run-tests.sh`.

## Next
1. **Tasks**: my / team tasks, task modal (title, assigned to, due, priority, person), Open / Done / Cancelled.
2. **Follow-ups list**: all open follow-ups by date, owner, type; "View all" target for Due today.
3. **Renewals**: "Renew" action on Clients and the profile (drawer work mode), automatic renewal follow-ups, and a Today section "Expiring this week".
4. **Global search (real)**: search leads, clients, FF ID, key fob, mobile from the top bar with results grouped by type.

## Later
- **Upgrade** (membership and PT, #44), opens in the drawer work mode (#64).
- **Transfer** (first Add-on, #45), drawer work mode.
- **Payment** module: converts on payment success, deposits, refunds, receipts.
- **Data migration** from the old system (people, memberships, FF IDs, fobs).
- **Meta sync**: live lead sync and auto-assign (Q10).

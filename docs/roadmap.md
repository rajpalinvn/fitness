# Roadmap

Screens in the mockup. Status per screen lives in `index.html` and each
feature README. Rules: `docs/decisions.md`. Questions: `docs/open-questions.md`.

## Done (Ready for review)
- App shell: sidebar with badges, top bar, inline search box, "View as" role, branch switcher, Display preferences.
- Today: overdue or not set, due today, my tasks, unassigned leads, clients with pending items.
- Leads list: pipeline cards, filters, Needs attention.
- Clients list: cards (Needs attention, Active, Renewal due, Expired), ends-on, PT, balance, pending, Collect payment.
- Profile drawer: Timeline, Tasks, Details, Docs, Membership, NEXT STEP, pending items, linkable URLs.
- Follow-ups: add, log outcome, cancel, Closed by system, lost, re-open, assign.
- Convert to Client: Sell mode in the drawer (details, package, sale & start, key fob, summary).
- Settings: Display, Packages, Items & stock (items, accessory stock, key fobs, tax categories), Sales rules.
- Settings › Roles & permissions: grid (8 tenant roles × 24 actions), settings values, roles, trainer types, audit log (#95, #96, #102).
- **Lead flow update** (#92–#101), done in c2–c4: Premium PT, Convert = Membership / Premium PT, Book trial (limits, approval, Trial ended, paid trial adjust); c4 ownership: follow-up assigned to other staff ("Follow-up from <owner>", "Own" scope incl. assignee), owner-change dialog (single, bulk, client, re-open), move to another branch ("Transferred in" + pick person), inactivity release ("Releases tomorrow", Unassigned · Released) and "Take this lead".
- Client answers (#103, c5): start date (no future, back date this month with permission), discount % + ₹ cap, refund permission, Ex-client card / filter, trial adjust GST on net, Premium PT discount on the PT line only (reference ₹0 allowed, one sales rep), Q32, Q36.
- Lead lifecycle (c8, #104–#109): events, `leads.own` / `sales.rep`, cross-branch follow-up + Sell here with the owner-change setting, notification rules, Make them owner on the transfer pick. Spec: docs/lead-lifecycle.md (its "Later" table: round-robin + shifts, old owner sees released leads, lost → pool, SMS / WhatsApp channels, CEO pending-work counts).
- Test runner: `bash tools/run-tests.sh`.

## Next
1. **Tasks**: my / team tasks, task modal (title, assigned to, due, priority, person), Open / Done / Cancelled.
2. **Follow-ups list**: all open follow-ups by date, owner, type; "View all" target for Due today.
3. **Renewals**: "Renew" action on Clients and the profile (drawer work mode), automatic renewal follow-ups, and a Today section "Expiring this week". Expired clients count in renewals for N days (Settings "Ex-client after", #103); Ex-clients are out. Requirement (#94, c4): the client Sell mode also offers the paid PT trial adjust on a NORMAL PT sale, only for a client with a paid membership (same running / buffer / permission rules); a lead without membership adjusts a PT trial only by buying Premium PT.
4. **Global search (real)**: search leads, clients, FF ID, key fob, mobile from the top bar with results grouped by type.

## Later
- **Upgrade** (membership and PT, #44), opens in the drawer work mode (#64).
- **Transfer** (first Add-on, #45), drawer work mode.
- **Payment** module: converts on payment success, deposits, refunds, receipts.
- **Data migration** from the old system (people, memberships, FF IDs, fobs).
- **Meta sync**: live lead sync and round-robin assignment (Q10, parked).

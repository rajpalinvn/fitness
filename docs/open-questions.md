# Open questions

Every question we have not decided yet. When one is decided, move it to
`docs/decisions.md` (with its number) and delete it here.

| # | Question | Context | Who decides | Mockup does now |
|---|---|---|---|---|
| Q32 | **Edit rule for Packages / Items** | Packages / Items are branch-owned (scope, #115), but their edit row `settings.packages` is a tick that also covers Tax and Sales rules (company-wide). Split into a scope edit row for Packages / Items and tick edit rows for Tax / Sales rules? | Product owner | Unchanged: `settings.packages` tick edits all four. |
| Q33 | **Saved source no longer applies** | A lead's saved Source no longer applies to its branch (lead moved, or the source's branches changed). Edit lead: keep it selectable, force a new pick, or clear it? | Product owner | Keeps it selectable in edit lead; Quick lead clears it on branch change. |
| Q34 | **Leads list Source filter** | Should the Leads list "Source" filter also show only sources for the selected branch? | Product owner | Shows all sources. |

## Parked (later phase)

| # | Question | Context | Who decides | Mockup does now |
|---|---|---|---|---|
| Q2 | **Trainer change on PT upgrade** (#103: not by SE; MXM and above) | Upgrade keeps the original start and freezes past payouts (#44). If the client also switches trainer, who gets the remaining sessions and payout? | Operations head + PT head | Not built (Upgrade later). |
| Q4 | **Key fob on transfer** | Transfer changes the home branch (#45). Fobs belong to a branch's stock (#13). Keep the old fob, swap it for a new-branch fob, and what happens to the deposit? | Operations head | Not built (Transfer later). |
| Q6 | **Fob on membership expiry / returning client** | When a membership ends, must the fob be returned (deposit refunded)? If the client renews or comes back later, do they keep the same fob and deposit? | Operations head | Fob stays Assigned after expiry. |
| Q10 | **Round-robin assignment (setting exists, Manual for now)** | Parked (notes v3 §5): the "New-lead assignment" setting is Manual (#96); round-robin comes later. Which branches, and skip people on leave? | Sales head | Manual assign by the roles the grid allows. |
| Q13 | **Online payment failure** | Offline payments convert on save (#79). When online payment (gateway) comes, what does staff see if it fails mid-way? | Payment module owner | Offline methods only. |
| Q18 | **Receipt numbering reset** | Does the per-branch receipt number restart each financial year (e.g. S31/26-27/000001)? | Accounts | Continuous per branch (S31-000124). |
| P1 | **Call + WhatsApp integration setup** | Click-to-call and WhatsApp sending from the app (today: mockup toasts + timeline entries). | Product owner | Not built. |
| P2 | **PT freeze while on hold** | PT end date keeps running while the membership is expired (c6, #83). A freeze (pause the PT end date) is a later-phase feature. | Product owner + PT head | No freeze. |

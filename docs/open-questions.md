# Open questions

Every question we have not decided yet. When one is decided, move it to
`docs/decisions.md` (with its number) and delete it here.

| # | Question | Context | Who decides | Mockup does now |
|---|---|---|---|---|
| Q1 | **Back-dated start date** | Start date is today up to 30 days ahead (#41). Front desk sometimes enters a sale a day late. Allow a back date, how many days, and who approves? | Operations head | Not allowed. |
| Q2 | **Trainer change on PT upgrade** | Upgrade keeps the original start and freezes past payouts (#44). If the client also switches trainer, who gets the remaining sessions and payout? | Operations head + PT head | Not built (Upgrade later). |
| Q3 | **Can trainers see package prices?** | Trainers see the "Rate updated · upgrade" badge (#44). Should they see the client's package price or only their own rate? | Permission matrix owner | Trainers see no prices. |
| Q4 | **Key fob on transfer** | Transfer changes the home branch (#45). Fobs belong to a branch's stock (#13). Keep the old fob, swap it for a new-branch fob, and what happens to the deposit? | Operations head | Not built (Transfer later). |
| Q6 | **Fob on membership expiry / returning client** | When a membership ends, must the fob be returned (deposit refunded)? If the client renews or comes back later, do they keep the same fob and deposit? | Operations head | Fob stays Assigned after expiry. |
| Q9 | **Free-item and audience defaults** | Free item rule default "Once per client" (#46) and package audience default "Both" (#47) are marked "Default, can change". Confirm? | Operations + marketing | Uses those defaults. |
| Q10 | **Round-robin assignment (setting exists, Manual for now)** | Parked (notes v3 §5): the "New-lead assignment" setting is Manual (#96); round-robin comes later. Which branches, and skip people on leave? | Sales head | Manual assign by the roles the grid allows. |
| Q13 | **Online payment failure** | Offline payments convert on save (#79). When online payment (gateway) comes, what does staff see if it fails mid-way? | Payment module owner | Offline methods only. |
| Q14 | **Couple PT partner** | Couple PT needs both people as active clients (#43). How is the partner picked at sale, and who is the "main" client for the sale line? | Operations + PT head | Not built (PT sale later). |
| Q17 | **FF ID format** | Is there a fixed FF ID format to check (e.g. "FF-" + 5 digits), or any text? | Operations | Any text, unique company-wide. |
| Q18 | **Receipt numbering reset** | Does the per-branch receipt number restart each financial year (e.g. S31/26-27/000001)? | Accounts | Continuous per branch (S31-000124). |
| Q19 | **Overdue balance** | What happens when a balance passes its due date: block entry, notify a manager, or only show red "Payment overdue"? | Operations + Accounts | Shown as "Payment due" with the date; follow-up turns overdue. |
| Q20 | **Refund / cancel a payment** | Who can reverse a saved receipt (wrong amount, bounced UPI), and does it go back to a lead if nothing is paid? | Accounts | Not built. |
| Q21 | **GST invoice rounding** | GST is calculated per line and summed (2 decimals). Should the tax invoice round per line or on the total, and is a GSTIN on the receipt needed? | Accounts | Per line, summed. |
| Q22 | **Discount above the limit** | Today over the limit is blocked. Should a manager be able to approve a higher discount in the moment? | Management | Blocked (no approval flow). |
| Q25 | **Ex-client** | When does an expired client become an "Ex-client" (the brief's search groups mention Ex-clients)? After N days expired, or never as a separate state? | Product owner + Operations | Expired badge only; no Ex-client state. |
| Q27 | **Paid trial adjust and GST** | The paid trial price is subtracted on conversion (#94). Does the accountant treat it as a discount or as an adjustment / credit on the invoice? | Accountant | Not built (Book trial / adjust come with the lead flow update). |
| Q28 | **Sales credit when a released lead is converted by someone else** | Priya owned the lead, it was released for inactivity (#100), Aman took it and converted. Credit only Aman's? | Management (incentive scheme) | Sales rep of the sale line gets the credit (#36). |
| Q29 | **Max unassigned leads one SE can take** | Only if the client asks: a limit on how many Unassigned leads one Sales Executive can take (#100). | Sales head | No limit. |

# Open questions

Every question we have not decided yet. When one is decided, move it to
`docs/decisions.md` (with its number) and delete it here.

| # | Question | Context | Who decides | Mockup does now |
|---|---|---|---|---|
| Q1 | **Back-dated start date** | Start date is today up to 30 days ahead (#41). Front desk sometimes enters a sale a day late. Allow a back date, how many days, and who approves? | Operations head | Not allowed. |
| Q2 | **Trainer change on PT upgrade** | Upgrade keeps the original start and freezes past payouts (#44). If the client also switches trainer, who gets the remaining sessions and payout? | Operations head + PT head | Not built (Upgrade later). |
| Q3 | **Can trainers see package prices?** | Trainers see the "Rate updated · upgrade" badge (#44). Should they see the client's package price or only their own rate? | Permission matrix owner | Trainers see no prices. |
| Q4 | **Key fob on transfer** | Transfer changes the home branch (#45). Fobs belong to a branch's stock (#13). Keep the old fob, swap it for a new-branch fob, and what happens to the deposit? | Operations head | Not built (Transfer later). |
| Q5 | **Paid trial: FF ID and fob rule** | #40 says "Paid trial: admin rule later". Required, optional or never? | Admin / operations | Paid trial shows no FF ID / fob pending items. |
| Q6 | **Fob on membership expiry / returning client** | When a membership ends, must the fob be returned (deposit refunded)? If the client renews or comes back later, do they keep the same fob and deposit? | Operations head | Fob stays Assigned after expiry. |
| Q7 | **Front desk role in the matrix** | Sales Executives and Sales Managers act as front desk (#62). Is "Front desk" a separate role later, and what can MXM do? | Management | SE / SM do front-desk actions; MXM does not. |
| Q8 | **Permission matrix** | All access is a placeholder (#15, #56, #62, #63): who sees which leads, edits masters, stock, waives, etc. | Management | Placeholders, labelled "Placeholder" on screen. |
| Q9 | **Free-item and audience defaults** | Free item rule default "Once per client" (#46) and package audience default "Both" (#47) are marked "Default, can change". Confirm? | Operations + marketing | Uses those defaults. |
| Q10 | **Auto-assign new leads** | Only managers assign today (#63). With Meta sync, should new leads be round-robined to Sales Executives of the branch (and skip people on leave)? | Sales head | Manual assign by managers. |
| Q11 | **Discount limits by role** | Sales Executive 10%, Sales Manager 20%, others no limit are placeholders (#48). Real limits and an approval flow above the limit? | Management | Placeholder limits, over-limit is blocked. |
| Q12 | **Free trial cap** | Free trials are unlimited with a warning ("3rd free trial", #39). Cap per person / per period? | Admin | Warning only. |
| Q13 | **Online payment failure** | Offline payments convert on save (#79). When online payment (gateway) comes, what does staff see if it fails mid-way? | Payment module owner | Offline methods only. |
| Q14 | **Couple PT partner** | Couple PT needs both people as active clients (#43). How is the partner picked at sale, and who is the "main" client for the sale line? | Operations + PT head | Not built (PT sale later). |
| Q17 | **FF ID format** | Is there a fixed FF ID format to check (e.g. "FF-" + 5 digits), or any text? | Operations | Any text, unique company-wide. |
| Q18 | **Receipt numbering reset** | Does the per-branch receipt number restart each financial year (e.g. S31/26-27/000001)? | Accounts | Continuous per branch (S31-000124). |
| Q19 | **Overdue balance** | What happens when a balance passes its due date: block entry, notify a manager, or only show red "Payment overdue"? | Operations + Accounts | Shown as "Payment due" with the date; follow-up turns overdue. |
| Q20 | **Refund / cancel a payment** | Who can reverse a saved receipt (wrong amount, bounced UPI), and does it go back to a lead if nothing is paid? | Accounts | Not built. |
| Q21 | **GST invoice rounding** | GST is calculated per line and summed (2 decimals). Should the tax invoice round per line or on the total, and is a GSTIN on the receipt needed? | Accounts | Per line, summed. |
| Q22 | **Discount above the limit** | Today over the limit is blocked. Should a manager be able to approve a higher discount in the moment? | Management | Blocked (no approval flow). |
| Q25 | **Ex-client** | When does an expired client become an "Ex-client" (the brief's search groups mention Ex-clients)? After N days expired, or never as a separate state? | Product owner + Operations | Expired badge only; no Ex-client state. |
| Q26 | **Paid trial ended without buying** | A paid trial client whose trial ended and who didn't buy a membership: stays a Client, goes back to a lead, or becomes an Ex-client? | Sales head | Stays a Client, status "Trial ended", shown under the Expired card. |


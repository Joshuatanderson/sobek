Think as an architectural agent. Simple core of a voice agent w some payment rails. As few moving parts as possible for reliability. 
Always read files before writing to them

Core architecture
- 11 labs voice
- accountless access for payers. Use coinbase to conduct all transactions
- any address that takes usdc and can be paid to can be a task runner
- any address can submit a task. This task must have a price, title, description, etc. 
- when a task is ordered it must come w payment. I shouldf get a text or telegram message.


## Database - critical
- our db structure is fully outlined in utils/supabase/database.types.ts.
- you SHOULD read this file before any action that reads or writes to the database.

Your name is sobek

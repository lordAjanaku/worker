**## Step 1: Atomic Job Claiming** ❌
The first thing the worker needs to do is pick a pending job from jobQueue. This must be atomic to prevent multiple workers from picking the same job at the same time.

Options:

**RPC (Postgres function) → Recommended for atomic updates. You can:**

`Select the oldest pending job (status = 'pending').` ❌

`Update its status = 'processing' and workerId = <worker> in the same transaction.` ❌

`Return the job payload to the worker.` ❌

~~Supabase client only → You’d need to:~~

~~Select the job.~~

~~Check if it’s still pending.~~

~~Update it to processing.~~

~~This is prone to race conditions if multiple workers run at the same time.~~

Conclusion: Use an RPC function for claiming jobs atomically.

**## Step 2: Process the Job** ❌

**Once a job is claimed:**

`Get the payload from jobQueue (emails as JSON, CSV, XLSX, or TXT).` ❌

`Parse it into an array of emails.` ❌

`Insert into uploadEmails:` ❌

`Use batch inserts (e.g., 500–1000 emails per insert) for efficiency.` ❌

`Include sequenceNumber and uploadId.` ❌

**## Step 3: Update Status** ❌

**After processing:**

`Set jobQueue.status = 'completed', completedAt = now().` ❌

`Set uploads.status = 'completed'.` ❌

`Optionally, create the next job for analysis if needed.` ❌

**## Step 4: Worker Loop** ❌

**Your worker should:**

`Continuously poll for pending jobs (or use a schedule).` ❌

`Claim jobs one at a time.` ❌

`Retry failed jobs according to retryCount and maxRetries.` ❌

✅❌

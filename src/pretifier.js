// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// class JobWorker {
//   constructor(workerId) {
//     this.workerId = workerId;
//     this.isRunning = false;
//   }

//   async start() {
//     this.isRunning = true;
//     console.log(`Worker ${this.workerId} started`);

//     while (this.isRunning) {
//       try {
//         await this.processNextJob();
//         await this.sleep(1000); // Poll every second
//       } catch (error) {
//         console.error("Worker error:", error);
//         await this.sleep(5000); // Wait longer on error
//       }
//     }
//   }

//   stop() {
//     this.isRunning = false;
//     console.log(`Worker ${this.workerId} stopped`);
//   }

//   async processNextJob() {
//     // Get the next pending job
//     const job = await this.claimNextJob();

//     if (!job) {
//       return; // No jobs available
//     }

//     console.log(`Processing job ${job.job_id}`);

//     try {
//       // Check if this job has child jobs
//       const hasChildren = await this.hasChildJobs(job.job_id);

//       if (hasChildren) {
//         console.log(`Job ${job.job_id} is a parent job, processing children`);
//         await this.processParentJob(job);
//       } else {
//         console.log(`Job ${job.job_id} is a normal job, processing directly`);
//         await this.processNormalJob(job);
//       }
//     } catch (error) {
//       await this.handleJobError(job, error);
//     }
//   }

//   async claimNextJob() {
//     // Atomically claim a job by updating worker_id and status
//     const { data, error } = await supabase.rpc("claim_next_job", {
//       worker_id_param: this.workerId,
//     });

//     if (error) {
//       console.error("Error claiming job:", error);
//       return null;
//     }

//     return data?.[0] || null;
//   }

//   async hasChildJobs(jobId) {
//     const { data, error } = await supabase.from("job_queue").select("job_id").eq("parent_job_id", jobId).limit(1);

//     if (error) {
//       console.error("Error checking for child jobs:", error);
//       return false;
//     }

//     return data && data.length > 0;
//   }

//   async processParentJob(parentJob) {
//     // Don't process parent job payload directly
//     // Instead, monitor child jobs and update parent as they complete

//     // Get all child jobs
//     const { data: childJobs, error } = await supabase.from("job_queue").select("*").eq("parent_job_id", parentJob.job_id).order("created_at", { ascending: true });

//     if (error) {
//       throw new Error(`Failed to fetch child jobs: ${error.message}`);
//     }

//     console.log(`Parent job ${parentJob.job_id} has ${childJobs.length} children`);

//     // Update parent to "processing" status
//     await supabase
//       .from("job_queue")
//       .update({
//         status: "processing",
//         started_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       })
//       .eq("job_id", parentJob.job_id);

//     // *Process each child job (or let other workers pick them up)
//     // For now, we'll just monitor their completion
//     await this.monitorChildJobs(parentJob, childJobs);
//   }

//   async monitorChildJobs(parentJob, childJobs) {
//     const childJobIds = childJobs.map((j) => j.job_id);

//     while (true) {
//       // Check status of all child jobs
//       const { data: currentChildJobs, error } = await supabase.from("job_queue").select("job_id, status, progress").in("job_id", childJobIds);

//       if (error) {
//         throw new Error(`Failed to monitor child jobs: ${error.message}`);
//       }

//       // Calculate overall progress
//       const totalProgress = currentChildJobs.reduce((sum, job) => sum + job.progress, 0);
//       const avgProgress = Math.floor(totalProgress / currentChildJobs.length);

//       // Update parent progress
//       await supabase
//         .from("job_queue")
//         .update({
//           progress: avgProgress,
//           updated_at: new Date().toISOString(),
//           heartbeat_at: new Date().toISOString(),
//         })
//         .eq("job_id", parentJob.job_id);

//       // Check if all children are completed
//       const allCompleted = currentChildJobs.every((job) => job.status === "completed");
//       const anyFailed = currentChildJobs.some((job) => job.status === "failed");

//       if (allCompleted) {
//         console.log(`All child jobs completed for parent ${parentJob.job_id}`);
//         await this.completeJob(parentJob.job_id);
//         break;
//       } else if (anyFailed) {
//         console.log(`Some child jobs failed for parent ${parentJob.job_id}`);
//         await this.failJob(parentJob.job_id, "One or more child jobs failed");
//         break;
//       }

//       // Wait before checking again
//       await this.sleep(2000);
//     }
//   }

//   async processNormalJob(job) {
//     // Update job status to processing
//     await supabase
//       .from("job_queue")
//       .update({
//         status: "processing",
//         started_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       })
//       .eq("job_id", job.job_id);

//     // Process the job payload based on job_type
//     switch (job.job_type) {
//       case "validation":
//         await this.processValidationJob(job);
//         break;
//       default:
//         throw new Error(`Unknown job type: ${job.job_type}`);
//     }

//     // Mark job as completed
//     await this.completeJob(job.job_id);
//   }

//   async processValidationJob(job) {
//     const emails = job.payload;
//     const totalEmails = emails.length;

//     console.log(`Validating ${totalEmails} emails`);

//     for (let i = 0; i < totalEmails; i++) {
//       const email = emails[i].trim();

//       // Perform validation (placeholder)
//       await this.validateEmail(email);

//       // Update progress
//       const progress = Math.floor(((i + 1) / totalEmails) * 100);
//       await supabase
//         .from("job_queue")
//         .update({
//           progress,
//           updated_at: new Date().toISOString(),
//           heartbeat_at: new Date().toISOString(),
//         })
//         .eq("job_id", job.job_id);

//       console.log(`Progress: ${progress}% (${i + 1}/${totalEmails})`);
//     }
//   }

//   async validateEmail(email) {
//     // Placeholder for actual email validation logic
//     // This could involve API calls, DNS checks, etc.
//     await this.sleep(100); // Simulate work
//     console.log(`Validated: ${email}`);
//   }

//   async completeJob(jobId) {
//     const { error } = await supabase
//       .from("job_queue")
//       .update({
//         status: "completed",
//         progress: 100,
//         completed_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       })
//       .eq("job_id", jobId);

//     if (error) {
//       console.error("Error completing job:", error);
//     } else {
//       console.log(`Job ${jobId} completed`);
//     }
//   }

//   async failJob(jobId, errorMessage) {
//     const { error } = await supabase
//       .from("job_queue")
//       .update({
//         status: "failed",
//         error_message: errorMessage,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("job_id", jobId);

//     if (error) {
//       console.error("Error failing job:", error);
//     }
//   }

//   async handleJobError(job, error) {
//     console.error(`Error processing job ${job.job_id}:`, error);

//     const nextRetryCount = job.retry_count + 1;

//     if (nextRetryCount <= job.max_retries) {
//       // Retry the job
//       await supabase
//         .from("job_queue")
//         .update({
//           status: "pending",
//           retry_count: nextRetryCount,
//           worker_id: null,
//           error_message: error.message,
//           updated_at: new Date().toISOString(),
//         })
//         .eq("job_id", job.job_id);

//       console.log(`Job ${job.job_id} queued for retry (${nextRetryCount}/${job.max_retries})`);
//     } else {
//       // Max retries exceeded, mark as failed
//       await this.failJob(job.job_id, `Max retries exceeded: ${error.message}`);
//     }
//   }

//   sleep(ms) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   }
// }

// ==================================================================

// ...existing code...
import { createClient } from "npm:@supabase/supabase-js@2.39.6";

const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");

if (!supabaseKey || !supabaseUrl) {
  throw new Error("Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function upload(data) {
  try {
    if (!data || typeof data !== "object") {
      return { data: null, error: { message: "Invalid payload", code: "INVALID_PAYLOAD" } };
    }

    const { user_id, emails, upload_type, file_name, file_type, file_size } = data;

    if (!user_id || typeof user_id !== "string") {
      return { data: null, error: { message: "Missing or invalid user_id", code: "INVALID_USER_ID" } };
    }

    if (!Array.isArray(emails)) {
      return { data: null, error: { message: "emails must be an array", code: "INVALID_EMAILS" } };
    }

    // sanitize emails: trim, toLowerCase, remove empties, filter short strings, dedupe
    const sanitizedEmails = Array.from(
      new Set(
        emails
          .map(function (e) {
            return e == null ? "" : String(e).trim().toLowerCase();
          })
          .filter(function (e) {
            return e.length > 4;
          })
      )
    );

    const total_emails = sanitizedEmails.length;

    const payload = {
      user_id: user_id,
      upload_type: typeof upload_type === "string" ? upload_type : null,
      emails: sanitizedEmails,
      total_emails: total_emails,
      file_name: typeof file_name === "string" ? file_name : null,
      file_type: typeof file_type === "string" ? file_type : null,
      file_size: typeof file_size === "number" ? file_size : file_size ? Number(file_size) : null,
    };

    const { data: insertData, error: insertError } = await supabase.from("uploads").insert(payload).select().single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return { data: null, error: { message: insertError.message || "Insert failed", code: insertError.code } };
    }

    if (insertData) {
      const { upload_id } = insertData;

      if (!upload_id) {
        return { data: null, error: { message: "Insert returned no id", code: "NO_UPLOAD_ID" } };
      }
    }

    const rpcUploadEmails = {
      p_emails: sanitizedEmails,
      p_upload_id: upload_id,
      p_user_id: user_id,
    };

    const { data: rpcData, error: rpcError } = await supabase.rpc("add_upload_emails", rpcUploadEmails);

    if (rpcError) {
      console.error("RPC error:", rpcError);
      // best-effort rollback
      try {
        await supabase.from("uploads").delete().eq("id", uploadId);
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr);
      }
      return { data: null, error: { message: rpcError.message || "RPC failed", code: rpcError.code } };
    }

    return { data: { upload: insertData, uploadEmails: rpcData }, error: null };
  } catch (err) {
    console.error("Unexpected error in upload:", err);
    return {
      data: null,
      error: { message: err && err.message ? err.message : String(err), code: "UNEXPECTED_ERROR" },
    };
  }
}
// ...existing code...

import { supabase } from "./auth.js";
import Validation from "../src/validation.js";

class Worker {
  constructor(workerId) {
    this.workerId = workerId;
    this.isRunning = false;

    console.log(this.workerId, this.isRunning);
  }

  async start() {
    this.isRunning = true;

    console.log("worker is working...");

    // while (this.isRunning) {
    this.processNextjob();
    // }
  }

  // ---------------------------

  async processNextjob() {
    try {
      console.log("next job processing...");

      const { data: claimNextJobData, error: claimNextJobError } = await this.claimNextJob();
      const job = claimNextJobData; // destructure the data array returned from the claimNextJob

      if (claimNextJobError) {
        console.log("process error", claimNextJobError);
        return;
      }

      // ----------------------
      // // console.log(`${job.job_id} job has been fetched`);

      // // this.isRunning = false;

      // // console.log("worker has stopped!");
      // ----------------------

      const { data: hasChildJobData, error: hasChildJobError } = await this.hasChildJob(job.job_id);

      if (hasChildJobError) {
        const { error: processNormalJobError } = await this.processNormalJob(job.job_id, job.job_type, job.upload_id);

        if (processNormalJobError) throw error;

        return;
      }

      // return;

      //! combacking for this
      const { data: processParentJobData, error: processParentJobError } = await this.processParentJob(job.job_id);
    } catch (error) {
      console.log(error);
    }
  }

  // ---------------------------

  async claimNextJob() {
    console.log("claim job processing...");

    let { data, error } = await supabase.rpc("claim_next_job", { worker_id_param: this.workerId });

    if (error) {
      console.log("claim next job >>>>: ", error);
      return { data: null, error };
    }

    [data] = data; // reasing a value of the data varible by destructuring

    console.log("claimNextJob >>>>: ", data);

    return { data, error: null };
  }

  // ---------------------------

  async hasChildJob(jobId) {
    console.log("has child job processing...");

    // prettier-ignore
    const { data: [data] } = await supabase.from("job_queue").select("job_id").eq("parent_job_id", jobId).limit(1);

    if (!data) {
      console.log("hasChildJob > error >>>>: ", data);
      // console.log("hasChildJob > error >>>>: ", error);
      return { data: null, error: { message: "no child was found" } };
    }

    console.log("hasChildJob > data >>>>: ", data);

    return { data, error: null } && data.length > 0;
  }

  // ---------------------------

  async processParentJob(jobId) {
    console.log("process parent job processing...");

    const { data: childJobIds, error } = await supabase.from("job_queue").select("job_id").eq("parent_job_id", jobId);

    if (error) {
      console.log("processParentJob >>>>: ", error);
      return;
    }

    const { error: updateParentError } = await supabase
      .from("job_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", jobId)
      .select();

    if (updateParentError) {
      console.log("processParentJob > updateParent >>>>: ", error);
      return;
    }

    // {
    // ^coming back to this, to check how i will approach all the child jobs
    // }

    // ^this code needs to run at an interval
    // const { data: monitorChildJobData, error: monitorChildJobError } = await this.monitorChildJob(jobId, childJobIds);
  }

  // ---------------------------

  async processNormalJob(jobId, jobType, uploadId) {
    console.log("process normal job processing...");

    const { data, error } = await supabase
      .from("job_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", jobId)
      .select();

    if (error) {
      console.log("processNormalJob > error >>>>>: ", error);
      return { data: null, error };
    }

    // {
    // ^coming back to this, to check how i will approach all the child jobs
    // }

    switch (jobType) {
      case "validation":
        console.log("upload-id >>>>", uploadId);

        const { data, error } = await supabase.from("upload_emails").select("email_address").eq("upload_id", uploadId);

        if (error) console.log(error);

        const emails = data.map((email) => Object.values(email)[0]);
        console.log(emails);

        const validator = new Validation(emails);

        console.log(validator);
        break;

      default:
    }

    return;
  }

  // ---------------------------

  // ! coming back to test this method
  async monitorChildJob(parentJobId, childJobIds) {
    while (true) {
      const { data, error } = await supabase.from("job_queue").select("job_id", "status", "progress").in("parent_job_id", childJobIds);

      //! combacking for this
      if (error) return;

      //! combacking for this
      if ((data.status = "completed")) await completeJob();

      if ((data.status = "failed")) await failJob();

      const processAverageData = data.reduce((progress, job) => (progress += job.progress), 0);

      //! combacking for this
      const { error: updateError } = await supabase.from("job_queue").update({ progress: progressAverage }).eq("job_id", parentJobId).select();

      //! combacking for this
      if (updateError) return;

      // {
      // ^more code are to be written
      // }
    }
  }

  // ---------------------------

  async processJob(jobType) {}

  // ---------------------------

  async completeJob() {}

  // ---------------------------

  async failJob() {}

  // ---------------------------

  async handleJobError() {}
}

export function createWorker(workerId) {
  return new Worker(workerId);
}

// import { supabase } from "../utils/auth.js";
// import { parseEmail } from "../utils/emailParser.js";
// import { createWorker } from "../utils/jobWorker.js";
// import { v4 as uuidv4 } from "uuid";

console.log("working");

// async function runWorker() {
//   console.log("Worker started...✅✅✅✅");

//   const UUID = uuidv4();
//   const worker = createWorker(UUID);

//   // const result = await worker.claimNextJob();
//   // console.log(result);

//   worker.start();

//   return;

//   while (true) {
//     const { data, error } = await supabase.from("job_queue").select("*").eq("status", "pending");

//     if (error) console.log("error: >>>", error);
//     else console.log(data);

//     return;
//   }
// }

// runWorker();

// else {
//   // no job → wait before polling again
//   await new Promise((r) => setTimeout(r, 5000));
// }

// const availableJobs = async () => {
//   let { data, error } = await supabase.rpc("claim_next_job", {
//     worker_id_param,
//   });
//   if (error) console.error(error);
//   else console.log(data);
// };

// availableJobs();

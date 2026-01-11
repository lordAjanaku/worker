"use strict";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import validator from "https://esm.sh/validator";

const SUPABASEU_URL = "https://dthtqcnldfqzgyltzwli.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHRxY25sZGZxemd5bHR6d2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Mzg5ODcsImV4cCI6MjA3NjQxNDk4N30.ygkI2XcRSVqYcWoKYQuv5bCj4jtdoS0XQGYbPGWGr10";
const supabase = createClient(SUPABASEU_URL, ANON_KEY);

// State management
let currentUser = null;
let isLoginMode = true;
let isLoading = false;

// Toast functionality
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconName = type === "success" ? "check-circle" : type === "error" ? "x-circle" : "alert-circle";

  // <i data-lucide="${iconName}"></i>
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="hideToast(this.parentElement)">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Initialize the new icon
  // lucide.createIcons();

  // Show toast
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto hide after 4 seconds
  setTimeout(() => hideToast(toast), 4000);
}

function hideToast(toast) {
  toast.classList.remove("show");
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

// Auth form management
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const nameGroups = document.querySelectorAll(".name-group");
  const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
  const submitBtn = document.getElementById("submitBtn");
  const toggleText = document.getElementById("toggleText");
  const toggleBtn = document.getElementById("toggleBtn");

  if (isLoginMode) {
    authTitle.textContent = "Welcome Back";
    authSubtitle.textContent = "Sign in to your account";
    confirmPasswordGroup.classList.add("hidden");
    submitBtn.textContent = "Sign In";
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = "Sign up";
    nameGroups.forEach((group) => group.classList.add("hidden"));
  } else {
    authTitle.textContent = "Create Account";
    authSubtitle.textContent = "Sign up to get started";
    confirmPasswordGroup.classList.remove("hidden");
    submitBtn.textContent = "Create Account";
    toggleText.textContent = "Already have an account?";
    toggleBtn.textContent = "Sign in";
    nameGroups.forEach((group) => group.classList.remove("hidden"));
  }
}

// Password visibility toggle
function togglePasswordVisibility(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  const icon = toggleBtn.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    // icon.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    // icon.setAttribute("data-lucide", "eye");
  }

  // lucide.createIcons();
}

// Dashboard functionality
function showDashboard() {
  document.getElementById("authPage").classList.add("hidden");
  document.getElementById("dashboardPage").classList.add("active");
}

// Authentication functions
async function signUpAccount(formData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) throw error;

    if (data?.user) {
      setTimeout(() => {
        createUserProfile(data, formData);
      }, 100);
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function createUserProfile(authData, formData) {
  try {
    const payload = {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
      body: {
        userId: authData.user.id,
        fullName: formData.fullName,
        email: authData.user.email,
        username: formData.username,
      },
    };

    const { data, error } = await supabase.functions.invoke("create_new_user", { ...payload });

    if (error) throw error;

    showToast("🎉Account created successfully");
    showDashboard();
  } catch (error) {
    console.error(error.message);
  }
}

async function signInAccount(formData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) throw error;

    showToast("🎉Login successfully");
    showDashboard();
  } catch (error) {
    console.error(error.message);
  }
}

// Email export functionality
async function exportEmails(bulkEmails) {
  if (!bulkEmails || bulkEmails.length === 0) return;

  try {
    const { data: authData } = await supabase.auth.getSession();
    const { data: emails } = await supabase.from("upload_emails").select("email_address").eq("upload_id", "4b7379dc-9bbb-42a6-9ece-3747774dcada");
    console.log("from testing >>> ", emails);

    if (!authData.session.user) {
      throw new Error("User not signed in");
    }

    const dataBody = {
      user_id: authData.session.user.id,
      emails: bulkEmails,
      upload_type: "validation",
      file_type: "text",
      file_name: null,
      file_size: null,
    };

    const { data, error, response } = await supabase.functions.invoke("upload_emails", {
      headers: { Authorization: `Bearer ${authData.session.access_token}` },
      body: JSON.stringify(dataBody),
    });

    if (error) {
      const newError = await response.json();
      throw JSON.parse(newError.error);
    }

    console.log("data recieved ✅", data);

    // const channel = supabase.channel(`channel-${data.response}`);
    // channel
    //   .on("postgres_changes", { event: "UPDATE", schema: "public", table: "", filter: "" }, (payload) => {
    //     // Handle updates here
    //   })
    //   .subscribe();

    const { data: validationData, error: validationError } = await supabase.functions.invoke("validation", {
      headers: { Authorization: `Bearer ${authData.session.access_token}` },
      body: JSON.stringify(dataBody), //to remove the emails property from dataBody
    });

    console.log("data from validation: ", validationData.data);
  } catch (error) {
    console.error(error.message);
  }
}

// Event listeners
document.getElementById("toggleBtn").addEventListener("click", toggleAuthMode);

document.getElementById("passwordToggle").addEventListener("click", function () {
  togglePasswordVisibility("passwordInput", this);
});

document.getElementById("confirmPasswordToggle").addEventListener("click", function () {
  togglePasswordVisibility("confirmPasswordInput", this);
});

// Form submission handler
const form = document.querySelector("#authForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (isLoginMode) {
    signInAccount(data);
  } else {
    signUpAccount(data);
  }
});

// Email analysis handler
window.addEventListener("click", async (e) => {
  if (!e.target.closest("#analyzeBtn")) return;

  const emails = document.querySelector("#emailTextarea").value.split(",");
  await exportEmails(emails);
});

// Enter key support
document.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !document.getElementById("authPage").classList.contains("hidden")) {
    handleAuth();
  }
});

// // sumeet_sethi@uhc.com, jeviadelpuerto@marathonpetroleum.com, kbouwman@apple.com, aboyle@costco.com, laura.snape@metlife.com, darshini.perera@boeing.com, claudia.neufeld@disney.com, paolomodolo@microsoft.com, johndeere@deere.com, colin-staunton@sysco.com, shailja.joshi@pepsico.com, robert.j.shearer@exxonmobil.com, shivani.chopra@hp.com, jaclyn.kapnis@libertymutual.com, albert.chang@cvshealth.com, jamie.sjoquist@unfi.com, marie.thornton@verizon.com, lea.wilkes@aig.com, kanchan.yadav@abbvie.com, claire.saines@techdata.com, lisa.mcbreen@morganstanley.com, nicole.lightbourne@rtx.com, tehan.samarasinha@chevron.com, lillie.reader@kroger.com, jill.newham@hcahealthcare.com, michael.schlissel@kohls.com, jesse.karassik@capitalone.com, romuald.veru@chsinc.com, katherine.brown@wellsfargo.com, priyanka.menda@abbott.com, natalie_park@fanniemae.com, julie.irving@elevancehealth.com, kandemir-john@aramark.com, dlee@lowes.com, laura.golder@marriott.com, jflores@meta.com, katherine.dolson@mckesson.com, bharucha.f@pg.com, eric.chang@avnet.com, kmayko@massmutual.com, astaszynska@lenovo.com, jacqueline.macera@cdw.com, beth.herd@valero.com, tofteland.laura@principal.com, david.douglas@adm.com, fbarbieri@walmart.com, mark.wright@travelers.com, jameswalton@ups.com, martinezc@autonation.com, tanya.champaign@fedex.com, fred.clark@target.com, erika.wasmund@pge.com, beth.hickey@energytransfer.com, sarah.tam@cigna.com, epujol@humana.com, tine.thorsen@chubb.com, sean.watson@conocophillips.com, leslie.motiwalla@cbre.com, jim.marasco@mckesson.com, sasa.mester@mastercard.com, lsheraton@paypal.com, mwingate@amfam.com, pieter.nelissen@blackrock.com, carley.cavanaugh@viacomcbs.com, timothy.carr@oracle.com, lori.ham@nm.com, mzanni@amgen.com, jorge.robles@generalmills.com, cnishandar@3m.com, rachel.gilmore@westrock.com, anitakoncabahar@pvh.com, john_crimmins@carmax.com, laura.reed@arrow.com, stefan.vogt@intel.com, rafhanah.hamid@jacobs.com, frank.jorfi@amerisourcebergen.com, wangr@coned.com, lara.mcclelland@pfizer.com, xiying.lin@exeloncorp.com, lynne.pressley@comcast.com, sean.whitehead@halliburton.com, andrew.jacobs@jacobs.com, bollams@altria.com, colleentuohy@guardianlife.com, breynolds@firstenergycorp.com, jacalyn.high@emerson.com, wum@altria.com, anna.altinger@nrg.com, jose.duarte@quantaservices.com, chapmanm@coned.com, kellyn.battrell@allstate.com, kevans@entergy.com, dean.david@aa.com, ktaylor@starbucks.com, wendy.wu@cardinalhealth.com, kimberly.robinson@aa.com, gareth.vale@manpowergroup.com, hshah@newyorklife.com, tara.estee@bestbuy.com, kathleen.lyons@usaa.com, sloanp@nationwide.com, colleendelaney@discover.com, s.sharma@statestreet.com, rthomas@starbucks.com, manderson@ta-petro.com, malbayati@amphenol.com, abdul.rahman@ally.com

// {
//   user_id: "7bb300fc-e1b4-4dd0-bb82-046ceef1acc6",
//   emails: [
//     "umeet_sethi@uhc.com",
//     " jeviadelpuerto@marathonpetroleum.com",
//     " kbouwman@apple.com"
//   ],
//   upload_type: "validation",
//   file_type: "text",
//   file_name: null,
//   file_size: null
// }

const Validation = {
  emails: [
    "sumeet_sethi@uhc.com",
    "jeviadelpuerto@marathonpetroleum.com",
    "kbouwman@apple.com",
    "aboyle@costco.com",
    "laura.snape@metlife.com",
    "darshini.perera@boeing.com",
    "claudia.neufeld@disney.com",
    "paolomodolo@microsoft.com",
    "johndeere@deere.com",
    "colin-staunton@sysco.com",
    "shailja.joshi@pepsico.com",
    "robert.j.shearer@exxonmobil.com",
    "shivani.chopra@hp.com",
    "jaclyn.kapnis@libertymutual.com",
    "albert.chang@cvshealth.com",
    "jamie.sjoquist@unfi.com",
    "marie.thornton@verizon.com",
    "lea.wilkes@aig.com",
    "kanchan.yadav@abbvie.com",
    "claire.saines@techdata.com",
    "lisa.mcbreen@morganstanley.com",
  ],
  isEmailsValidated: true,
  validEmails: [
    {
      email: "sumeet_sethi@uhc.com",
      isRoleBase: false,
    },
    {
      email: "jeviadelpuerto@marathonpetroleum.com",
      isRoleBase: false,
    },
    {
      email: "kbouwman@apple.com",
      isRoleBase: false,
    },
    {
      email: "aboyle@costco.com",
      isRoleBase: false,
    },
    {
      email: "laura.snape@metlife.com",
      isRoleBase: false,
    },
    {
      email: "darshini.perera@boeing.com",
      isRoleBase: false,
    },
    {
      email: "claudia.neufeld@disney.com",
      isRoleBase: false,
    },
    {
      email: "paolomodolo@microsoft.com",
      isRoleBase: false,
    },
    {
      email: "johndeere@deere.com",
      isRoleBase: false,
    },
    {
      email: "colin-staunton@sysco.com",
      isRoleBase: false,
    },
    {
      email: "shailja.joshi@pepsico.com",
      isRoleBase: false,
    },
    {
      email: "robert.j.shearer@exxonmobil.com",
      isRoleBase: false,
    },
    {
      email: "shivani.chopra@hp.com",
      isRoleBase: false,
    },
    {
      email: "jaclyn.kapnis@libertymutual.com",
      isRoleBase: false,
    },
    {
      email: "albert.chang@cvshealth.com",
      isRoleBase: false,
    },
    {
      email: "jamie.sjoquist@unfi.com",
      isRoleBase: false,
    },
    {
      email: "marie.thornton@verizon.com",
      isRoleBase: false,
    },
    {
      email: "lea.wilkes@aig.com",
      isRoleBase: false,
    },
    {
      email: "kanchan.yadav@abbvie.com",
      isRoleBase: false,
    },
    {
      email: "claire.saines@techdata.com",
      isRoleBase: false,
    },
    {
      email: "lisa.mcbreen@morganstanley.com",
      isRoleBase: false,
    },
  ],
  invalidEmails: [],
  roleBasedEmails: [],
  nonRoleBasedEmails: [
    {
      email: "sumeet_sethi@uhc.com",
      isRoleBase: false,
    },
    {
      email: "jeviadelpuerto@marathonpetroleum.com",
      isRoleBase: false,
    },
    {
      email: "kbouwman@apple.com",
      isRoleBase: false,
    },
    {
      email: "aboyle@costco.com",
      isRoleBase: false,
    },
    {
      email: "laura.snape@metlife.com",
      isRoleBase: false,
    },
    {
      email: "darshini.perera@boeing.com",
      isRoleBase: false,
    },
    {
      email: "claudia.neufeld@disney.com",
      isRoleBase: false,
    },
    {
      email: "paolomodolo@microsoft.com",
      isRoleBase: false,
    },
    {
      email: "johndeere@deere.com",
      isRoleBase: false,
    },
    {
      email: "colin-staunton@sysco.com",
      isRoleBase: false,
    },
    {
      email: "shailja.joshi@pepsico.com",
      isRoleBase: false,
    },
    {
      email: "robert.j.shearer@exxonmobil.com",
      isRoleBase: false,
    },
    {
      email: "shivani.chopra@hp.com",
      isRoleBase: false,
    },
    {
      email: "jaclyn.kapnis@libertymutual.com",
      isRoleBase: false,
    },
    {
      email: "albert.chang@cvshealth.com",
      isRoleBase: false,
    },
    {
      email: "jamie.sjoquist@unfi.com",
      isRoleBase: false,
    },
    {
      email: "marie.thornton@verizon.com",
      isRoleBase: false,
    },
    {
      email: "lea.wilkes@aig.com",
      isRoleBase: false,
    },
    {
      email: "kanchan.yadav@abbvie.com",
      isRoleBase: false,
    },
    {
      email: "claire.saines@techdata.com",
      isRoleBase: false,
    },
    {
      email: "lisa.mcbreen@morganstanley.com",
      isRoleBase: false,
    },
  ],
  totalEmails: 21,
  emailProviders: {
    "uhc.com": 1,
    "marathonpetroleum.com": 1,
    "apple.com": 1,
    "costco.com": 1,
    "metlife.com": 1,
    "boeing.com": 1,
    "disney.com": 1,
    "microsoft.com": 1,
    "deere.com": 1,
    "sysco.com": 1,
    "pepsico.com": 1,
    "exxonmobil.com": 1,
    "hp.com": 1,
    "libertymutual.com": 1,
    "cvshealth.com": 1,
    "unfi.com": 1,
    "verizon.com": 1,
    "aig.com": 1,
    "abbvie.com": 1,
    "techdata.com": 1,
    "morganstanley.com": 1,
  },
  roleBase: 0,
  nonRoleBase: 21,
};

const test = {
  user_id: "7bb300fc-e1b4-4dd0-bb82-046ceef1acc6",
  emails: [
    "sumeet_sethi@uhc.com",
    " jeviadelpuerto@marathonpetroleum.com",
    " kbouwman@apple.com",
    " aboyle@costco.com",
    " laura.snape@metlife.com",
    " darshini.perera@boeing.com",
    " claudia.neufeld@disney.com",
    " paolomodolo@microsoft.com",
    " johndeere@deere.com",
    " colin-staunton@sysco.com",
    " shailja.joshi@pepsico.com",
    " robert.j.shearer@exxonmobil.com",
    " shivani.chopra@hp.com",
    " jaclyn.kapnis@libertymutual.com",
    " albert.chang@cvshealth.com",
    " jamie.sjoquist@unfi.com",
    " marie.thornton@verizon.com",
    " lea.wilkes@aig.com",
    " kanchan.yadav@abbvie.com",
    " claire.saines@techdata.com",
  ],
  upload_type: "validation",
  file_type: "text",
  file_name: null,
  file_size: null,
  ip: "105.113.79.49,105.113.79.49, 3.2.48.150",
  upload: {
    upload_id: "6bc1981a-4251-42a4-a072-9883af7bd161",
    user_id: "7bb300fc-e1b4-4dd0-bb82-046ceef1acc6",
    upload_type: "validation",
    file_name: null,
    file_type: "text",
    file_size: null,
    total_emails: 20,
    emails: [
      "sumeet_sethi@uhc.com",
      "jeviadelpuerto@marathonpetroleum.com",
      "kbouwman@apple.com",
      "aboyle@costco.com",
      "laura.snape@metlife.com",
      "darshini.perera@boeing.com",
      "claudia.neufeld@disney.com",
      "paolomodolo@microsoft.com",
      "johndeere@deere.com",
      "colin-staunton@sysco.com",
      "shailja.joshi@pepsico.com",
      "robert.j.shearer@exxonmobil.com",
      "shivani.chopra@hp.com",
      "jaclyn.kapnis@libertymutual.com",
      "albert.chang@cvshealth.com",
      "jamie.sjoquist@unfi.com",
      "marie.thornton@verizon.com",
      "lea.wilkes@aig.com",
      "kanchan.yadav@abbvie.com",
      "claire.saines@techdata.com",
    ],
    status: "pending",
    created_at: "2026-01-07T17:53:21.169108+00:00",
    complete_at: null,
  },
  uploadEmails: [],
  analysis_id: "832cdfb8-6031-431b-a4dc-91f1a1e38c93",
};

const obj = {
  ip: "105.113.79.49,105.113.79.49, 3.2.48.150",
  upload: {
    upload_id: "6bc1981a-4251-42a4-a072-9883af7bd161",
    user_id: "7bb300fc-e1b4-4dd0-bb82-046ceef1acc6",
  },
};

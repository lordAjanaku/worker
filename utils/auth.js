import { createClient } from "@supabase/supabase-js";

const SUPABASEU_URL = "https://dthtqcnldfqzgyltzwli.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHRxY25sZGZxemd5bHR6d2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Mzg5ODcsImV4cCI6MjA3NjQxNDk4N30.ygkI2XcRSVqYcWoKYQuv5bCj4jtdoS0XQGYbPGWGr10";

export const supabase = createClient(SUPABASEU_URL, ANON_KEY);

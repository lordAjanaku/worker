1. Upload completes
   └→ jobQueue: {jobType: 'analysis', uploadId: 'xxx', status: 'pending'}

2. Worker picks job
   └→ analyses: {analysisId: 'yyy', uploadId: 'xxx', status: 'processing'}
   └→ jobQueue: updated with {analysisId: 'yyy', status: 'processing'}

3. Worker processes emails
   └→ advancedEmailResults: (multiple rows, one per email)
   └→ advancedAnalysis: {totalEmails: 1000, highQualityLeads: 450, ...}

4. Processing completes
   └→ analyses: {status: 'completed', completedAt: NOW()}
   └→ jobQueue: {status: 'completed', progress: 100}

5. User wants to export (NEW user action)
   └→ jobQueue: {jobType: 'export', analysisId: 'yyy', status: 'pending'}
   └→ exports: {analysisId: 'yyy', status: 'pending'}

6. Worker picks export job
   └→ Generates file
   └→ exports: {status: 'completed', filePath: '/path/to/file.csv'}
   └→ jobQueue: {status: 'completed'}

# =======================================================================================

=======================================================================================

### 1. User upload file/emails

└→ uploads: {✅
uploadId: 'upload-001',
userId: 'user-123',
fileName: 'leads.csv',
uploadType: 'bulk',
fileSize: 52428,
status: 'pending'
}

└→ jobQueue: {✅
jobId: 'job-001',
userId: 'user-123',
uploadId: 'upload-001',
jobType: 'file_processing',
status: 'pending',
priority: 0
}

└→ userActivities: {❌
userId: 'user-123',
activityType: 'file_upload',
entityType: 'upload',
entityId: 'upload-001'
}

### 2. Worker picks up file processing job

```
└→ jobQueue: {
     jobId: 'job-001',
     status: 'processing',
     workerId: 'worker-A',
     startedAt: NOW(),
     progress: 0
   }

└→ uploads: {
     uploadId: 'upload-001',
     status: 'processing'
   }
```

### 3. Worker parses file and extracts emails

```
└→ uploadEmails: [
     {id: 1, uploadId: 'upload-001', emailAddress: 'john@company.com', sequenceNumber: 1, isValidFormat: true},
     {id: 2, uploadId: 'upload-001', emailAddress: 'sales@startup.io', sequenceNumber: 2, isValidFormat: true},
     {id: 3, uploadId: 'upload-001', emailAddress: 'invalid@', sequenceNumber: 3, isValidFormat: false},
     ... (997 more rows)
   ]

└→ uploads: {
     uploadId: 'upload-001',
     totalEmails: 1000,
     emails: [{email: 'john@company.com'}, {email: 'sales@startup.io'}, ...] // JSONB array
   }

└→ jobQueue: {
     jobId: 'job-001',
     progress: 100
   }
```

### 4. File processing completes

`
└→ uploads: {
uploadId: 'upload-001',
status: 'completed',
completedAt: NOW()
}

└→ jobQueue: {
jobId: 'job-001',
status: 'completed',
completedAt: NOW()
}

└→ userActivities: {
userId: 'user-123',
activityType: 'file_processed',
entityType: 'upload',
entityId: 'upload-001',
activityDetails: {totalEmails: 1000, validEmails: 998}
}

=======================================================================================

## **Phase 2: Analysis Job Created**

### 5. System creates analysis job (triggered by upload completion or user action)

```
└→ jobQueue: {
     jobId: 'job-002',
     userId: 'user-123',
     uploadId: 'upload-001',
     jobType: 'advanced_analysis',
     status: 'pending',
     priority: 0,
     payload: {analysisType: 'advanced'}
   }
```

### 6. Worker picks up analysis job

```
└→ jobQueue: {
     jobId: 'job-002',
     status: 'processing',
     workerId: 'worker-B',
     startedAt: NOW(),
     heartbeatAt: NOW()
   }

└→ analyses: {
     analysisId: 'analysis-001',
     userId: 'user-123',
     uploadId: 'upload-001',
     analysisType: 'advanced',
     status: 'processing',
     startedAt: NOW()
   }

└→ advancedAnalysis: {
     analysisId: 'analysis-001',
     totalEmails: 1000,
     processedEmails: 0,
     highQualityLeads: 0,
     corporateEmails: 0
   }

└→ jobQueue: {
     jobId: 'job-002',
     analysisId: 'analysis-001' // Link created
   }
```

### 7. Worker processes each email (iterative)

```
// For each email in uploadEmails...

└→ advancedEmailResults: [
     {
       id: 1,
       analysisId: 'analysis-001',
       emailAddress: 'john@company.com',
       domain: 'company.com',
       isValidSyntax: true,
       isCorporate: true,
       leadStatus: 'high-quality',
       deliverabilityScore: 95,
       spfPass: true,
       dkimPass: true,
       riskLevel: 'low'
     },
     {
       id: 2,
       analysisId: 'analysis-001',
       emailAddress: 'sales@startup.io',
       domain: 'startup.io',
       isValidSyntax: true,
       isRoleBased: true,
       isCorporate: true,
       leadStatus: 'medium-quality',
       deliverabilityScore: 82,
       riskLevel: 'low'
     },
     ... (998 more rows)
   ]

└→ advancedAnalysis: {
     analysisId: 'analysis-001',
     processedEmails: 1000  // Updated as processing continues
   }

└→ jobQueue: {
     jobId: 'job-002',
     progress: 75,  // Updated incrementally
     heartbeatAt: NOW()  // Updated periodically
   }
```

### 8. Analysis completes

```
└→ advancedAnalysis: {
     analysisId: 'analysis-001',
     totalEmails: 1000,
     processedEmails: 1000,
     highQualityLeads: 450,
     corporateEmails: 780
   }

└→ analyses: {
     analysisId: 'analysis-001',
     status: 'completed',
     completedAt: NOW()
   }

└→ jobQueue: {
     jobId: 'job-002',
     status: 'completed',
     progress: 100,
     completedAt: NOW()
   }

└→ userActivities: {
     userId: 'user-123',
     activityType: 'analysis_completed',
     entityType: 'analysis',
     entityId: 'analysis-001',
     activityDetails: {highQualityLeads: 450, corporateEmails: 780}
   }
```

---

## **Phase 3: User Exports Results**

### 9. User requests export

```
└→ exports: {
     exportId: 'export-001',
     userId: 'user-123',
     analysisId: 'analysis-001',
     fileName: 'advanced_analysis_results.csv',
     fileType: 'csv',
     status: 'pending'
   }

└→ jobQueue: {
     jobId: 'job-003',
     userId: 'user-123',
     analysisId: 'analysis-001',
     exportId: 'export-001',
     jobType: 'export',
     status: 'pending'
   }

└→ userActivities: {
     userId: 'user-123',
     activityType: 'export_requested',
     entityType: 'export',
     entityId: 'export-001'
   }
```

### 10. Worker picks up export job

```
└→ jobQueue: {
     jobId: 'job-003',
     status: 'processing',
     workerId: 'worker-C',
     startedAt: NOW(),
     progress: 0
   }

└→ exports: {
     exportId: 'export-001',
     status: 'processing'
   }
```

### 11. Worker generates export file

```
└→ exports: {
     exportId: 'export-001',
     filePath: '/exports/user-123/advanced_analysis_results_20251019.csv',
     fileSize: 245760,
     status: 'completed',
     completedAt: NOW(),
     expiresAt: NOW() + 7 days
   }

└→ jobQueue: {
     jobId: 'job-003',
     status: 'completed',
     progress: 100,
     completedAt: NOW()
   }

└→ userActivities: {
     userId: 'user-123',
     activityType: 'export_completed',
     entityType: 'export',
     entityId: 'export-001'
   }
```

### 12. User downloads file

```
└→ exports: {
     exportId: 'export-001',
     downloadCount: 1  // Incremented with each download
   }

└→ userActivities: {
     userId: 'user-123',
     activityType: 'file_downloaded',
     entityType: 'export',
     entityId: 'export-001'
   }

=======================================================================================
=======================================================================================
=======================================================================================

1. Upload completes
   └→ jobQueue: {jobId: 'job-001', jobType: 'file_processing', status: 'completed'}

2. System AUTOMATICALLY creates analysis job
   └→ jobQueue: {jobId: 'job-002', jobType: 'advanced_analysis', status: 'pending'}
```

**This happens if:**

- Your backend has logic that says: "When upload completes, auto-create analysis job"
- Users expect immediate analysis after upload
- The workflow is: Upload → Always Analyze

---

## **Approach 2: Manual Trigger (What I said earlier)**

```
1. Upload completes
   └→ jobQueue: {jobId: 'job-001', jobType: 'file_processing', status: 'completed'}

2. User sits on dashboard, sees upload is ready

3. User clicks "Analyze Emails" button
   └→ jobQueue: {jobId: 'job-002', jobType: 'advanced_analysis', status: 'pending'}
```

**This happens if:**

- Users can choose WHEN to analyze
- Users can choose WHICH analysis type to run
- Upload and analysis are separate actions

---

## **Which one is YOUR system?**

Looking at your schema, I see:

- Multiple analysis types: `singleAnalysis`, `bulkAnalysis`, `validatorAnalysis`, `advancedAnalysis`
- User can choose different analysis types for the same upload

**This suggests Approach 2 is more likely** - because the user needs to choose which type of analysis to run!

---

## **Corrected Flow (Most Likely for Your System):**

### **Phase 1: Upload Only**

```
1. User uploads file
   └→ uploads: {uploadId: 'upload-001', status: 'pending'}
   └→ jobQueue: {jobId: 'job-001', jobType: 'file_processing', uploadId: 'upload-001', status: 'pending'}

2. Worker processes file
   └→ uploadEmails: [1000 rows]
   └→ uploads: {status: 'completed', totalEmails: 1000}
   └→ jobQueue: {jobId: 'job-001', status: 'completed'}

// STOP HERE - No automatic analysis job created
```

### **Phase 2: User Chooses Analysis (Separate Action)**

```
3. User clicks "Run Advanced Analysis" button on the UI
   └→ analyses: {analysisId: 'analysis-001', uploadId: 'upload-001', analysisType: 'advanced', status: 'pending'}
   └→ jobQueue: {jobId: 'job-002', jobType: 'advanced_analysis', uploadId: 'upload-001', analysisId: 'analysis-001', status: 'pending'}

4. Worker picks up analysis job
   └→ [Processing happens as I described before]


=======================================================================================
=======================================================================================
=======================================================================================
=======================================================================================

create table public."jobQueue" (
  "jobId" uuid not null default gen_random_uuid (),
  "userId" uuid not null,
  "uploadId" uuid null,
  "analysisId" uuid null,
  "exportId" uuid null,
  "parentJobId" uuid null,
  "jobType" text null,
  payload jsonb null,
  status text null default 'pending'::text,
  progress integer null default 0,
  priority integer null default 0,
  "errorMessage" text null,


  "retryCount" integer null default 0,
  "maxRetries" integer null default 3,
  "retryAfter" timestamp with time zone null,
  "workerId" text null default 'system'::text,
  "startedAt" timestamp with time zone null,
  "heartbeatAt" timestamp with time zone null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  "completedAt" timestamp with time zone null,


  constraint jobQueue_pkey primary key ("jobId"),
  constraint jobQueue_exportId_fkey foreign KEY ("exportId") references exports ("exportId") on delete CASCADE,
  constraint jobQueue_parentJobId_fkey foreign KEY ("parentJobId") references "jobQueue" ("jobId") on delete CASCADE,
  constraint jobQueue_analysisId_fkey foreign KEY ("analysisId") references analyses ("analysisId") on delete CASCADE,
  constraint jobQueue_uploadId_fkey foreign KEY ("uploadId") references uploads ("uploadId") on delete CASCADE,
  constraint jobQueue_userId_fkey foreign KEY ("userId") references "userProfiles" ("userId") on delete CASCADE,
  constraint jobqueue_one_fk check (
    (
      (
        (
          (("uploadId" is not null))::integer + (("analysisId" is not null))::integer
        ) + (("exportId" is not null))::integer
      ) = 1
    )
  )
) TABLESPACE pg_default;
```

this my folder structure: i want to import other js files into the worker.js, how can i do.

worker
└→node_modules
└→package-lock.json
└→package.json
└→worker.js

user_id
upload_id
job_type
payload jsonb null

analysis_id null
export_id null
parent_job_id null

max_retries
retry_count
priority

=========================================================================================

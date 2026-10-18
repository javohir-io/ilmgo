# Ilmgo API contract (v2)

Base URL: `http://localhost:3000`. All bodies are JSON unless marked multipart.
Auth: `Authorization: Bearer <jwt>`. Errors are always `{ "error": "message" }` with a 4xx/5xx status.
Dates: timestamps are ISO-8601 strings. Interview `date` is a plain calendar day `YYYY-MM-DD`, `time` is `HH:mm` (24h).
`optionalAuth` = works without a token, but adds personalised fields when a token is sent.

## Shapes

```jsonc
// User
{ "id", "name", "email", "role": "student" | "admin", "university", "degreeProgram",
  "graduationYear": 2027 | null, "phone", "about", "title",
  "skills": ["Flutter","Node.js"], "githubUrl": "", "linkedinUrl": "",
  "profilePhotoUrl": "/uploads/images/x.png" | null,
  "profileCompleteness": 0-100, "createdAt" }

// Job   (matchScore / matchedSkills / isSaved / applicationStatus only when a valid token is sent)
{ "id", "title", "company", "location",
  "type": "Internship" | "Part-time" | "Full-time" | "Co-op",
  "workMode": "Remote" | "Hybrid" | "On-site",
  "level": "Entry" | "Junior" | "Mid",
  "stipend": "$25–30 / hour" | "",
  "deadline": ISO | null, "status": "open" | "closed", "featured": bool,
  "accent": "#00638E",                 // brand colour (one of #00638E #004A6B #8CB9CC #BFD8E3) used for gradients/monograms; no logo assets exist
  "skills": ["C++","Unreal Engine"],   // used for match score
  "description", "requirements": [str], "benefits": [str], "companyAbout",
  "imageUrl": "/uploads/images/x.png" | null, "createdAt",
  "matchScore": 0-100, "matchedSkills": [str], "isSaved": bool,
  "applicationStatus": null | ApplicationStatus }

ApplicationStatus = "submitted" | "reviewing" | "interview" | "offer" | "rejected" | "withdrawn"

// Application
{ "id", "userId", "jobId", "firstName","lastName","address","city","university","phone","email",
  "skillLevel": "Beginner" | "Intermediate" | "Advanced",
  "coverNote", "resumeOriginalName", "resumeUrl": "/uploads/<file>",
  "status": ApplicationStatus, "createdAt", "updatedAt",
  "job": { "id","title","company","accent","location","type" },
  "events": [ { "status", "note", "createdAt" } ],         // oldest first; present on list + detail
  "user": { "id","name","email" } }                          // admin endpoints only

// Interview
{ "id","userId","jobId","applicationId","date":"2026-11-03","time":"14:00","durationMin":30,
  "reason","status":"scheduled"|"cancelled"|"completed","createdAt",
  "job": { "id","title","company","accent" }, "user": { "id","name","email" } /* admin only */ }

// Notification
{ "id","type":"application_status"|"interview_booked"|"interview_cancelled"|"welcome"|"job_match",
  "title","body","link": { "kind":"application"|"interview"|"job"|null, "id": str|null },
  "readAt": ISO|null, "createdAt" }
```

## Auth
| Method | Path | Auth | Body → Response |
|---|---|---|---|
| POST | `/api/auth/register` | – | `{name,email,password(min 8),university?,degreeProgram?}` → 201 `{token,user}` (409 if email exists) |
| POST | `/api/auth/login` | – | `{email,password}` → `{token,user}` (401 on bad creds) |
| GET | `/api/auth/me` | ✔ | → `{user}` |
| PUT | `/api/auth/me` | ✔ | any of `name,university,degreeProgram,graduationYear,phone,about,title,skills[],githubUrl,linkedinUrl` → `{user}` |
| POST | `/api/auth/me/photo` | ✔ | multipart field `photo` (jpg/png/webp/gif ≤5MB) → `{user}` |

## Jobs
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/jobs` | optionalAuth | query: `search, type, workMode, level, skill, featured=1, status=open|closed|all (default open), sort=recent|match|deadline` → `{jobs}`. `sort=match` needs a token (falls back to recent). |
| GET | `/api/jobs/meta` | – | → `{types:[], workModes:[], levels:[], skills:[{name,count}]}` (skills = most used, max 30) |
| GET | `/api/jobs/saved` | ✔ | → `{jobs}` (each `isSaved:true`) |
| GET | `/api/jobs/:id` | optionalAuth | → `{job}` |
| POST | `/api/jobs/:id/save` | ✔ | toggles → `{jobId,isSaved}` |
| POST | `/api/jobs` | admin | create (`title,company,location,description` required; others optional) → 201 `{job}` |
| PUT | `/api/jobs/:id` | admin | partial update → `{job}` |
| DELETE | `/api/jobs/:id` | admin | → `{success:true}` |
| POST | `/api/jobs/:id/image` | admin | multipart field `image` → `{job}` |

## Applications
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/applications` | ✔ | multipart: `jobId,firstName,lastName,address?,city?,university?,phone,email,skillLevel,coverNote?` + file `resume` (pdf/doc/docx ≤10MB) → 201 `{application}`. 409 if already applied, 400 if job closed. |
| GET | `/api/applications` | ✔ | own applications, newest first → `{applications}` |
| GET | `/api/applications/:id` | ✔ | own only → `{application}` |
| POST | `/api/applications/:id/withdraw` | ✔ | → `{application}` (only while submitted/reviewing/interview) |

## Interviews
Slots are fixed 30‑minute blocks, weekdays only, never in the past: `09:00 09:30 10:00 10:30 11:00 11:30 13:00 13:30 14:00 14:30 15:00 15:30 16:00 16:30`.
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/interviews/slots?jobId=&date=YYYY-MM-DD` | ✔ | → `{date, slots:[{time:"09:00", available:bool}]}` (empty `slots` on weekends/past days) |
| POST | `/api/interviews` | ✔ | `{jobId, applicationId?, date, time, reason?}` → 201 `{interview}`. 409 `{error}` if the slot is taken. Moves the application to `interview`. |
| GET | `/api/interviews` | ✔ | own, soonest first → `{interviews}` |
| POST | `/api/interviews/:id/cancel` | ✔ | → `{interview}` |

## Notifications
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications` | ✔ | newest first, max 50 → `{notifications, unread:int}` |
| POST | `/api/notifications/read-all` | ✔ | → `{unread:0}` |
| POST | `/api/notifications/:id/read` | ✔ | → `{unread:int}` |

## Student overview (home screen payload)
`GET /api/me/overview` ✔ → 
```jsonc
{ "stats": { "applied": n, "saved": n, "interviews": n, "offers": n },
  "profileCompleteness": 0-100,
  "nextInterview": Interview | null,
  "recentApplications": [Application],   // max 3
  "recommended": [Job],                  // max 6, open jobs sorted by matchScore desc, excluding already-applied
  "unreadNotifications": n }
```

## Admin (role = admin, otherwise 403)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/stats` | `{ totals:{users,jobs,openJobs,applications,interviews,offers}, applicationsByStatus:{submitted,reviewing,interview,offer,rejected,withdrawn}, applicationsPerDay:[{date:"2026-10-01",count}] /*last 14 days, zero-filled*/, topJobs:[{id,title,company,accent,applications}] /*max 5*/, upcomingInterviews:[Interview] /*max 5*/ }` |
| GET | `/api/admin/users` | `{users:[User + {applications:int}]}` |
| GET | `/api/admin/applications` | query `status, jobId, q` → `{applications}` (with `user`, `job`, `events`) |
| PATCH | `/api/admin/applications/:id` | `{status, note?}` → `{application}`; writes an event and notifies the student |
| GET | `/api/admin/applications.csv` | CSV download (needs `?token=<jwt>` OR bearer header) |
| GET | `/api/admin/interviews` | `{interviews}` with `user` + `job` |
| POST | `/api/admin/interviews/:id/complete` | → `{interview}` |

## Misc
- `GET /api/health` → `{status:"ok", database:"connected", time}`
- Static: `/uploads/*` (resumes, images). If `web/dist` exists, the backend serves the web app at `/` (SPA fallback) and the admin console at `/admin`.
- Language: enum values and field names are English and stable; human-readable messages (errors, notifications, interview/status copy) and seed data are Uzbek. Clients translate enums for display.
- Seeded accounts (dev): admin `admin@ilmgo.uz` / `Admin123!`, student `demo@ilmgo.uz` / `Demo1234!`.

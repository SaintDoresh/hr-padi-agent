# HR Padi — Resume Parser Micro-Agent

A single-page Next.js app for the Prolanz BOS platform. A recruiter drops in an
applicant's resume PDF and gets a structured candidate profile: contact details,
core skills, work history, education, a 0–100 fit score and a short recruiter
verdict.

- **PDF text extraction in the browser** with `pdfjs-dist` (loaded on first use).
  Ligatures and run spacing are rebuilt from glyph positions, so "fi ve" reads "five".
- **LLM extraction on the server** (`app/api/parse`) via `groq-sdk`, in JSON mode.
  The key never reaches the browser.
- **The schema always holds.** Whatever the model returns passes through
  `normalizeProfile` (`lib/schema.ts`): missing fields become empty values, numbers
  are clamped, names the model reworded are snapped back to the resume's own words,
  and roles are ordered most recent first. The UI cannot receive a malformed profile.
- **Fit against a role.** "Hiring for" is optional. Left empty, the candidate is
  scored against their own headline.
- **Load Sample Candidate** parses a fictional resume in one click.
- **Session only.** Resumes are not stored or logged. The candidate list lives in the tab.

## Run it

```bash
npm install
cp .env.example .env.local   # then paste a free key from https://console.groq.com/keys
npm run dev                  # http://localhost:3000
```

| Variable | Required | |
|---|---|---|
| `GROQ_API_KEY` | yes | Server-side only. |
| `GROQ_MODEL` | no | The model to try first. |

### Model

The PRD names `llama-3.3-70b-versatile`. Groq has retired it for some keys, so the
route tries it first and falls back to `openai/gpt-oss-120b`, with low reasoning effort.
In testing, that model parsed a real two-page resume in about 1.8 s. It remembers which
model answered, so a retired one costs a single extra round trip.

## Deploy (Vercel Hobby)

Import the repo in Vercel, add `GROQ_API_KEY` under Project → Settings →
Environment Variables, and deploy. Nothing else is needed. Groq's free tier means
no API charges, though it is rate-limited. When the limit is hit, the app says so
and asks the user to wait a few seconds.

## Layout

```
app/
  page.tsx              the single page
  api/parse/route.ts    Groq call, model fallback, error mapping
components/
  Workspace.tsx         state: upload → read → parse → profile; the candidate list
  UploadZone.tsx        drag-and-drop, file picker, sample button
  CandidateProfile.tsx  the dashboard
  Shell.tsx             sidebar / phone drawer
  ui.tsx                panels, stat cards, pills, buttons, score ring
lib/
  pdf.ts                PDF → text in the browser
  prompt.ts             system prompt and models
  schema.ts             CandidateProfile type and normalizer
  sample.ts             the sample resume
```

The interface follows a vendor-portal style: roomy white panels on a soft page,
hairlines instead of shadows, and pill actions in one red accent. Colours are CSS
variables in `app/globals.css`; change `--accent-hue` to re-hue everything.

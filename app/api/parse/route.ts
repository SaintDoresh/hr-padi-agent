import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { MODELS, SYSTEM_PROMPT, userPrompt } from '@/lib/prompt';
import { LIMITS, normalizeProfile, type ParseResponse } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The model that answered last, tried first next time so a retired one costs one round trip, once. */
let workingModel: string | null = null;

function candidates(): string[] {
  const configured = process.env.GROQ_MODEL?.trim();
  const list = [workingModel, configured, ...MODELS].filter((m): m is string => typeof m === 'string' && m !== '');
  return [...new Set(list)];
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fail(500, 'GROQ_API_KEY is not set on the server. Add a free key from console.groq.com to .env.local (or the Vercel project settings).');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Expected a JSON body.');
  }
  const { text, role } = (body ?? {}) as { text?: unknown; role?: unknown };
  if (typeof text !== 'string' || text.trim().length < LIMITS.minResumeChars) {
    return fail(422, 'Not enough readable text in this resume. Scanned (image-only) PDFs are not supported yet.');
  }
  const resumeText = text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim().slice(0, LIMITS.resumeChars);
  const targetRole = typeof role === 'string' ? role.slice(0, LIMITS.roleChars) : '';

  const groq = new Groq({ apiKey, maxRetries: 1, timeout: 20_000 });
  const started = Date.now();
  try {
    let content = '';
    let used = '';
    for (const model of candidates()) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          temperature: 0,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
          // Reasoning models think before answering; extraction needs little of it, and speed matters.
          ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' as const } : {}),
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt(resumeText, targetRole) },
          ],
        });
        content = completion.choices[0]?.message?.content ?? '';
        used = model;
        workingModel = model;
        break;
      } catch (error) {
        // A retired or unavailable model: try the next one. Anything else is a real failure.
        if (error instanceof Groq.APIError && (error.status === 404 || error.status === 400) && /model/i.test(error.message)) continue;
        throw error;
      }
    }
    if (used === '') return fail(502, 'None of the configured Groq models are available. Set GROQ_MODEL to one your key can use.');
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      return fail(502, 'The model returned something that was not JSON. Try again.');
    }
    const payload: ParseResponse = { profile: normalizeProfile(raw, resumeText), model: used, llm_ms: Date.now() - started };
    return NextResponse.json(payload);
  } catch (error) {
    // Log the status only — never the resume or the profile (they are personal data).
    const status = error instanceof Groq.APIError ? (error.status ?? 502) : 502;
    console.error('[hr-padi] groq request failed', { status });
    if (status === 401) return fail(500, 'The Groq API key was rejected. Check GROQ_API_KEY.');
    if (status === 429) return fail(429, 'Groq rate limit reached on the free tier. Wait a few seconds and try again.');
    return fail(502, 'Could not reach the parsing model. Try again in a moment.');
  }
}

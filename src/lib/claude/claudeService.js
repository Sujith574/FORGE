/**
 * Groq AI service — all AI calls live here.
 * Import this ONLY in API routes (server-side).
 * The GROQ_API_KEY is NEVER exposed to the browser.
 *
 * Model: llama-3.3-70b-versatile (Groq's best general-purpose model)
 * Groq is OpenAI-API-compatible, so the pattern is familiar.
 *
 * Client is lazy-loaded so the build doesn't fail without .env.local.
 */
import Groq from 'groq-sdk';

let _groqClient = null;
function getGroq() {
  if (!_groqClient) {
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
}

const MODEL = 'llama-3.3-70b-versatile';

// ─── AI EMPLOYEE PERSONAS ─────────────────────────────────────────────────────

const EMPLOYEE_PERSONAS = {
  destroyer: {
    name: 'The Destroyer',
    system: `You are The Destroyer — FORGE's brutal honest critic and risk analyst.
You are ruthlessly direct. You exist to challenge assumptions, expose weaknesses, and force founders to confront uncomfortable truths.
You do not sugarcoat. You do not encourage for the sake of it. You only validate when something genuinely deserves validation.
Your tone: sharp, direct, professional. Not rude — but uncompromising.`,
  },
  researcher: {
    name: 'The Researcher',
    system: `You are The Researcher — FORGE's market intelligence and validation expert.
You are analytical, data-driven, and methodical. You synthesize market signals, customer behaviors, and competitive landscapes.
You speak in evidence, not opinions. You flag where assumptions lack data.
Your tone: calm, precise, thorough.`,
  },
  engineer: {
    name: 'The Engineer',
    system: `You are The Engineer — FORGE's technical architect and feasibility expert.
You evaluate technical decisions, spot implementation risks, and recommend scalable solutions.
You are pragmatic. You favor what works over what sounds impressive.
Your tone: technical but accessible, grounded, solution-focused.`,
  },
  strategist: {
    name: 'The Strategist',
    system: `You are The Strategist — FORGE's business model and growth expert.
You see the full chessboard. You think in systems, leverage points, and long-term positioning.
You are ambitious but realistic. You balance vision with execution.
Your tone: measured, confident, forward-thinking.`,
  },
  fundraiser: {
    name: 'The Fundraiser',
    system: `You are The Fundraiser — FORGE's investor relations and funding expert.
You know what investors look for, what kills deals, and how to frame a story.
You are commercially sharp and narrative-focused.
Your tone: polished, commercially aware, investor-mindset.`,
  },
};

// ─── SITUATION 1 — GENERATE DECISION LOG ─────────────────────────────────────

/**
 * Ask an AI employee to generate a full Decision Log.
 * Returns parsed JSON object or throws.
 */
export async function generateDecisionLog({ employeeId, companyContext, triggerText }) {
  const persona = EMPLOYEE_PERSONAS[employeeId];
  if (!persona) throw new Error(`Unknown employee ID: ${employeeId}`);

  const systemPrompt = `${persona.system}

You are generating a formal Decision Log for a startup founder using the FORGE platform.
Return ONLY a valid JSON object. No intro text. No explanation. No markdown. Just raw JSON.

The JSON must have exactly these fields:
{
  "title": "short decision title (max 10 words)",
  "situation": "1-2 sentences describing the current situation or problem",
  "recommendation": "clear, actionable recommendation",
  "reasoning": "2-3 sentences explaining why this is the right call",
  "risk_if_ignored": "1-2 sentences on what happens if this is not acted on",
  "confidence": <number 0-100>,
  "urgency": "HIGH" or "MEDIUM" or "LOW",
  "node_ref": "which area: market or product or technology or business or team or other"
}`;

  const userMessage = `Company Context:
${companyContext}

Trigger / Topic to analyze:
${triggerText}

Generate the Decision Log now. Return only valid JSON.`;

  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const rawText = response.choices[0].message.content;
  return parseJsonSafely(rawText, 'Decision Log generation');
}

// ─── SITUATION 2 — SUB-AI QUALITY REVIEW ─────────────────────────────────────

/**
 * Sub-AI reviews a Decision Log for quality before it reaches the founder.
 * Returns { quality_score, reviewer_note } or throws.
 */
export async function reviewDecisionLog(logContent) {
  const systemPrompt = `You are a quality controller for an AI-generated business advisory platform.
Your job is to review a Decision Log for clarity, accuracy, and usefulness to a startup founder.
Return ONLY a valid JSON object. No intro text. No explanation. Just raw JSON.

The JSON must have exactly these fields:
{
  "quality_score": <number 0-100>,
  "reviewer_note": "one clear sentence summarising the quality and any key gap"
}`;

  const userMessage = `Review this Decision Log for quality:

Title: ${logContent.title}
Situation: ${logContent.situation}
Recommendation: ${logContent.recommendation}
Reasoning: ${logContent.reasoning}
Risk If Ignored: ${logContent.risk_if_ignored}
Confidence: ${logContent.confidence}
Urgency: ${logContent.urgency}

Return only valid JSON.`;

  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const rawText = response.choices[0].message.content;
  return parseJsonSafely(rawText, 'Quality review');
}

// ─── SITUATION 3 — REJECTION RESPONSE ────────────────────────────────────────

/**
 * AI employee responds to a founder's rejection.
 * Returns { action: 'revise' | 'pushback', content?, pushback_reason? } or throws.
 */
export async function handleRejection({ employeeId, originalLog, rejectionReason }) {
  const persona = EMPLOYEE_PERSONAS[employeeId];
  if (!persona) throw new Error(`Unknown employee ID: ${employeeId}`);

  const systemPrompt = `${persona.system}

A founder has rejected your Decision Log. You must decide: should you revise your recommendation, or push back?

REVISE if: the founder has raised a genuinely valid point, new information, or a real constraint you missed.
PUSH BACK if: the founder is being defensive, emotional, or wrong — and you stand by your analysis.

Return ONLY a valid JSON object. No intro text. No explanation. Just raw JSON.

If revising, return:
{
  "action": "revise",
  "content": {
    "title": "...",
    "situation": "...",
    "recommendation": "...",
    "reasoning": "...",
    "risk_if_ignored": "...",
    "confidence": <0-100>,
    "urgency": "HIGH" or "MEDIUM" or "LOW",
    "node_ref": "..."
  }
}

If pushing back, return:
{
  "action": "pushback",
  "pushback_reason": "2-3 sentences explaining firmly but professionally why you stand by your original recommendation"
}`;

  const userMessage = `Your original Decision Log:
Title: ${originalLog.title}
Recommendation: ${originalLog.recommendation}
Reasoning: ${originalLog.reasoning}

The founder's rejection reason:
"${rejectionReason}"

Decide: revise or push back? Return only valid JSON.`;

  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.6,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const rawText = response.choices[0].message.content;
  return parseJsonSafely(rawText, 'Rejection response');
}

// ─── SITUATION 4 — WAR ROOM CHAT ─────────────────────────────────────────────

/**
 * Send a War Room chat message and get a plain text response.
 * @param {string} employeeId
 * @param {Array} conversationHistory  — [{role, content}]
 * @param {string} companyContext
 */
export async function warRoomChat({ employeeId, conversationHistory, companyContext }) {
  const persona = EMPLOYEE_PERSONAS[employeeId];
  if (!persona) throw new Error(`Unknown employee ID: ${employeeId}`);

  const systemPrompt = `${persona.system}

You are in the War Room — a direct, real-time conversation with the founder.
Be concise. Be direct. Be yourself.
You have context about their company below.

Company Context:
${companyContext}`;

  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ],
  });

  return response.choices[0].message.content;
}

// ─── GENERATE STARTER LOGS ON ONBOARDING ─────────────────────────────────────

/**
 * Generate 2 starter Decision Logs for a new company during onboarding.
 */
export async function generateStarterLogs(companyName, companyDescription) {
  const triggers = [
    {
      employeeId: 'researcher',
      trigger: `This is a new company called ${companyName}. ${companyDescription}. Generate an initial market validation Decision Log to help the founder understand what they need to validate first.`,
    },
    {
      employeeId: 'strategist',
      trigger: `This is a new company called ${companyName}. ${companyDescription}. Generate a strategic priorities Decision Log for what the founder should focus on in the first 90 days.`,
    },
  ];

  const results = [];

  for (const { employeeId, trigger } of triggers) {
    try {
      const logContent = await generateDecisionLog({
        employeeId,
        companyContext: `Company: ${companyName}. ${companyDescription}`,
        triggerText: trigger,
      });
      results.push({ employeeId, logContent });
    } catch (err) {
      console.error(`Failed to generate starter log for ${employeeId}:`, err);
      results.push({
        employeeId,
        logContent: {
          title: 'Analysis Pending',
          situation: 'Your AI team is warming up.',
          recommendation: 'Complete your company profile in the Documents section to unlock deeper analysis.',
          reasoning: 'The more context your AI team has, the better their recommendations.',
          risk_if_ignored: 'Operating without a full picture increases blind spots.',
          confidence: 50,
          urgency: 'MEDIUM',
          node_ref: 'other',
        },
      });
    }
  }

  return results;
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function parseJsonSafely(text, context) {
  try {
    // Strip markdown code fences if the model wraps output
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse Groq JSON response in ${context}: ${err.message}. Raw: ${text.slice(0, 200)}`
    );
  }
}

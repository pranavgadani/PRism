const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Sleep helper for retry backoff.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Stream a single Groq step with retry logic.
 * Retries up to `maxRetries` times on loop-detection or rate-limit errors.
 */
const streamStep = async (messages, onToken, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages,
        stream: true,
        temperature: 0.4 + attempt * 0.05, // slightly raise temp on each retry to break loops
        max_tokens: 1536,
        top_p: 0.9,
        frequency_penalty: 0.3,  // penalise repeated tokens → prevents loop detection
        presence_penalty: 0.2,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullContent += token;
          if (onToken) onToken(token);
        }
      }
      return fullContent;

    } catch (err) {
      const isLoopError = err?.message?.toLowerCase().includes('looping') ||
                          err?.message?.toLowerCase().includes('loop detection') ||
                          err?.status === 400;
      const isRateLimit = err?.status === 429;

      if ((isLoopError || isRateLimit) && attempt < retries) {
        const backoff = attempt * 2000; // 2s, 4s, 6s
        console.warn(`⚠️  Groq error (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${backoff}ms…`);
        await sleep(backoff);
        continue;
      }

      // Final attempt failed — throw with a clean message
      throw new Error(`Groq API error after ${attempt} attempt(s): ${err.message}`);
    }
  }
};

/**
 * Trim previous step outputs to avoid sending massive context back to the model.
 * Groq loop detection often fires when context is extremely long and repetitive.
 */
const trimOutput = (text, maxChars = 1500) => {
  if (!text || text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n…[truncated for context]';
};

/**
 * Run the 4-step AI review pipeline.
 * @param {string} rawDiff
 * @param {function} onStepStart  (step, label)
 * @param {function} onToken      (step, token)
 * @param {function} onStepDone   (step, content)
 */
const runReviewPipeline = async (rawDiff, onStepStart, onToken, onStepDone) => {
  // Truncate diff to stay well within token limits
  const truncatedDiff = rawDiff.length > 8000
    ? rawDiff.substring(0, 8000) + '\n\n...[diff truncated for length]'
    : rawDiff;

  // ─── Step 1: PR Summary ────────────────────────────────────────
  onStepStart(1, 'Summarizing PR...');
  const step1Output = await streamStep(
    [
      {
        role: 'system',
        content:
          'You are a senior software engineer reviewing a GitHub pull request. ' +
          'Be concise and specific. Do not repeat yourself.',
      },
      {
        role: 'user',
        content:
          `Here is the unified diff for a pull request:\n\n${truncatedDiff}\n\n` +
          `Please provide:\n` +
          `1. A 2-3 sentence summary of what this PR does\n` +
          `2. Which files were changed and why\n` +
          `3. The type of change: feature, bugfix, refactor, or docs`,
      },
    ],
    (token) => onToken(1, token)
  );
  onStepDone(1, step1Output);

  // ─── Step 2: Issue Detection ───────────────────────────────────
  onStepStart(2, 'Detecting issues...');
  const step2Output = await streamStep(
    [
      {
        role: 'system',
        content:
          'You are a code security and quality reviewer. ' +
          'Identify issues clearly and concisely without repeating points.',
      },
      {
        role: 'user',
        content:
          `Diff:\n\n${truncatedDiff}\n\n` +
          `PR Summary: ${trimOutput(step1Output, 600)}\n\n` +
          `Identify up to 5 distinct issues in this PR. For each issue write:\n` +
          `[SEVERITY: HIGH/MED/LOW] <brief description with file/line reference if applicable>\n\n` +
          `Categories to check: bugs/logic errors, security vulnerabilities, performance problems, code smells.`,
      },
    ],
    (token) => onToken(2, token)
  );
  onStepDone(2, step2Output);

  // ─── Step 3: Improvement Suggestions ──────────────────────────
  onStepStart(3, 'Generating suggestions...');
  const step3Output = await streamStep(
    [
      {
        role: 'system',
        content:
          'You are a senior engineer focused on code quality. ' +
          'Give actionable, non-repetitive suggestions.',
      },
      {
        role: 'user',
        content:
          `Issues found in this PR:\n\n${trimOutput(step2Output, 1200)}\n\n` +
          `For each issue above, provide:\n` +
          `1. A corrected code snippet (keep it short)\n` +
          `2. One sentence explaining why it is better\n\n` +
          `Be specific to the actual code. Do not repeat issue descriptions verbatim.`,
      },
    ],
    (token) => onToken(3, token)
  );
  onStepDone(3, step3Output);

  // ─── Step 4: Final Score (non-streaming JSON) ──────────────────
  onStepStart(4, 'Calculating score...');

  // Use non-streaming for JSON to avoid partial parse issues
  let step4Output = '';
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a tech lead. Respond ONLY with valid JSON — no markdown, no explanation.',
        },
        {
          role: 'user',
          content:
            `Based on this PR review:\n\n` +
            `Summary: ${trimOutput(step1Output, 400)}\n` +
            `Issues: ${trimOutput(step2Output, 600)}\n` +
            `Suggestions: ${trimOutput(step3Output, 400)}\n\n` +
            `Return a JSON object with exactly these fields:\n` +
            `{\n` +
            `  "score": <integer 0-100>,\n` +
            `  "scoreBreakdown": {\n` +
            `    "codeQuality": <integer 0-25>,\n` +
            `    "security": <integer 0-25>,\n` +
            `    "performance": <integer 0-25>,\n` +
            `    "readability": <integer 0-25>\n` +
            `  },\n` +
            `  "verdict": "<APPROVE or REQUEST CHANGES or NEEDS DISCUSSION>",\n` +
            `  "verdictLine": "<one sentence summary of your recommendation>"\n` +
            `}`,
        },
      ],
      stream: false,
      temperature: 0.1,
      max_tokens: 300,
    });

    step4Output = response.choices[0]?.message?.content || '{}';
    // Emit the raw JSON as tokens so the UI shows something
    onToken(4, step4Output);
  } catch (err) {
    console.error('Score step error:', err.message);
    step4Output = '{"score":50,"scoreBreakdown":{"codeQuality":12,"security":12,"performance":13,"readability":13},"verdict":"NEEDS DISCUSSION","verdictLine":"Could not generate score due to an API error."}';
    onToken(4, step4Output);
  }
  onStepDone(4, step4Output);

  // Parse score JSON
  let scoreData = {
    score: 50,
    scoreBreakdown: { codeQuality: 12, security: 12, performance: 13, readability: 13 },
    verdict: 'NEEDS DISCUSSION',
    verdictLine: 'Review complete.',
  };
  try {
    const jsonMatch = step4Output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate that verdict is one of the allowed values
      const allowedVerdicts = ['APPROVE', 'REQUEST CHANGES', 'NEEDS DISCUSSION'];
      if (!allowedVerdicts.includes(parsed.verdict)) {
        parsed.verdict = 'NEEDS DISCUSSION';
      }
      scoreData = parsed;
    }
  } catch (e) {
    console.error('Score parse error:', e.message);
  }

  return {
    summary: step1Output,
    issues: step2Output,
    suggestions: step3Output,
    score: scoreData.score,
    scoreBreakdown: scoreData.scoreBreakdown,
    verdict: scoreData.verdict,
    verdictLine: scoreData.verdictLine,
  };
};

module.exports = { runReviewPipeline };

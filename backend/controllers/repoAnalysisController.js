const axios = require('axios');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /github/repos/:owner/:repo/analyze
const analyzeRepo = async (req, res) => {
  const { owner, repo } = req.params;
  const accessToken = req.user.accessToken;

  try {
    // 1. Fetch repo metadata (already known, but get fresh + include topics)
    const repoRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.mercy-preview+json',
        },
      }
    );
    const repoData = repoRes.data;

    // 2. Try to fetch README content (base64 encoded)
    let readmeText = '';
    try {
      const readmeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      // Decode base64
      const raw = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
      // Trim to first 3000 chars to stay within token limits
      readmeText = raw.slice(0, 3000);
    } catch {
      readmeText = 'No README available.';
    }

    // 3. Build context for Groq
    const context = `
Repository: ${repoData.full_name}
Description: ${repoData.description || 'None'}
Language: ${repoData.language || 'Unknown'}
Topics: ${repoData.topics?.join(', ') || 'None'}
Stars: ${repoData.stargazers_count}
Forks: ${repoData.forks_count}
Open Issues: ${repoData.open_issues_count}
Size: ${repoData.size} KB
License: ${repoData.license?.name || 'None'}
Created: ${repoData.created_at}
Last Updated: ${repoData.updated_at}

README (first 3000 chars):
${readmeText}
    `.trim();

    // 4. Ask Groq to analyze
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior software engineer and technical writer. 
Analyze GitHub repositories and return a clear, structured JSON analysis.
Always respond ONLY with valid JSON — no markdown, no code fences, no extra text.`,
        },
        {
          role: 'user',
          content: `Analyze this GitHub repository and return a JSON object with EXACTLY these keys:

{
  "what": "1-2 sentences: what does this project do?",
  "why": "1-2 sentences: why would someone use this / what problem does it solve?",
  "techStack": ["list", "of", "main", "technologies", "used"],
  "keyFeatures": ["feature 1", "feature 2", "feature 3"],
  "targetAudience": "who is this for?",
  "projectType": "one of: Web App / CLI Tool / Library / API / Mobile App / Data Science / Game / Other",
  "complexity": "one of: Beginner / Intermediate / Advanced",
  "tags": ["tag1", "tag2", "tag3"]
}

Repository data:
${context}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';

    // Parse JSON — strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { what: 'Could not parse analysis.', why: '', techStack: [], keyFeatures: [], targetAudience: '', projectType: 'Other', complexity: 'Unknown', tags: [] };
    }

    res.json(analysis);
  } catch (err) {
    console.error('Repo analysis error:', err.message);
    res.status(500).json({ message: 'Failed to analyze repository' });
  }
};

module.exports = { analyzeRepo };

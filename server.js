require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set in .env — /api/classify and /api/quiz will fail until it is.');
}

const SYSTEM_PROMPT = `You classify a single chat message from a peer-support app for seniors and people with chronic illness. Respond ONLY with JSON: {"label": "ok"|"scam"|"crisis"|"toxic"}. 'scam' = requests for money, gift cards, banking info, or pushing to contact off-platform. 'crisis' = suicidal or self-harm language. 'toxic' = insults or hostility. Otherwise 'ok', including ordinary venting.`;

const QUIZ_PROMPT = `Generate 5 gentle, senior-friendly multiple-choice trivia questions on the given theme. Respond ONLY with JSON: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0}]}. Keep questions light, non-medical, and non-triggering.`;

// POST /api/classify  { text }  ->  { label: "ok" | "scam" | "crisis" | "toxic" }
app.post('/api/classify', async (req, res) => {
  const text = (req.body && req.body.text || '').toString();
  if (!text.trim()) return res.status(400).json({ error: 'text is required' });

  try {
    const [modRes, classifyRes] = await Promise.all([
      fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
        body: JSON.stringify({ input: text })
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
        body: JSON.stringify({
          model: 'gpt-5.4-nano',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text }
          ]
        })
      })
    ]);

    const modData = await modRes.json();
    const classifyData = await classifyRes.json();

    const moderationFlagged = modData.results && modData.results[0] && modData.results[0].flagged;
    let label = 'ok';
    try {
      label = JSON.parse(classifyData.choices[0].message.content).label || 'ok';
    } catch (e) {
      label = 'ok';
    }

    // If OpenAI's moderation endpoint flags it but our classifier said "ok",
    // treat it as toxic rather than silently letting it through.
    if (moderationFlagged && label === 'ok') label = 'toxic';

    res.json({ label });
  } catch (err) {
    console.error('classify error:', err.message);
    res.status(502).json({ error: 'classification failed', detail: err.message });
  }
});

// POST /api/quiz  { theme }  ->  { questions: [...] }
app.post('/api/quiz', async (req, res) => {
  const theme = (req.body && req.body.theme || '').toString();
  if (!theme.trim()) return res.status(400).json({ error: 'theme is required' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: QUIZ_PROMPT },
          { role: 'user', content: theme }
        ]
      })
    });
    const data = await r.json();
    const questions = JSON.parse(data.choices[0].message.content).questions;
    res.json({ questions });
  } catch (err) {
    console.error('quiz generation error:', err.message);
    res.status(502).json({ error: 'quiz generation failed', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Haven server running at http://localhost:${PORT}`);
});

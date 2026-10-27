import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google GenAI SDK if API key is present
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({});
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with environment key:', err);
  }
}

const CLINICAL_SAFETY_SYSTEM_INSTRUCTION = `You are an AI assistant in CareLoop, an oncology and screening care coordination platform.
SAFETY RULES (NON-NEGOTIABLE):
1. You MUST NEVER diagnose conditions, interpret raw imaging/pathology metrics, assign clinical urgency, recommend unapproved medical treatments, or decide when care can be postponed.
2. You only rephrase, format, or translate clinician-approved next actions and result summaries provided in the prompt.
3. NEVER invent appointments, test results, provider schedules, or clinical claims.
4. Keep patient communication clear, culturally attuned, respectful, empathetic, and at approximately a 6th-grade reading level.
5. In SMS/WhatsApp modes, omit unnecessary alarming medical jargon; advise the patient to check their secure portal or contact the clinic.`;

// 1. Rewrite approved content in simpler plain language
app.post('/api/ai/simplify', async (req: Request, res: Response) => {
  const { content, language } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    return res.json({
      fallback: true,
      message: 'AI service not configured on server; fallback engine should be used.'
    });
  }

  try {
    const prompt = `Rewrite the following clinician-approved healthcare notification in simple, reassuring, plain language (${language || 'English'}, ~6th grade reading level) for a patient. Keep all contact details, dates, and essential instructions intact:\n\n${content}`;
    const result = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CLINICAL_SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      }
    });

    res.json({
      success: true,
      simplifiedText: result.text?.trim() || content,
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Error in /api/ai/simplify:', error);
    res.status(500).json({ error: error.message || 'Gemini API call failed', fallback: true });
  }
});

// 2. Translate approved message to English, Hindi, or Marathi
app.post('/api/ai/translate', async (req: Request, res: Response) => {
  const { content, targetLanguage } = req.body;
  if (!content || !targetLanguage) {
    return res.status(400).json({ error: 'content and targetLanguage are required' });
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    return res.json({
      fallback: true,
      message: 'AI service not configured on server; fallback engine should be used.'
    });
  }

  try {
    const prompt = `Translate this clinician-approved patient message into ${targetLanguage} (use authentic, natural Devanagari script for Hindi or Marathi, formal yet warm tone, standard respectful healthcare pronouns like 'जी' in Hindi or respectful honorifics in Marathi):\n\n${content}`;
    const result = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CLINICAL_SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.2,
      }
    });

    res.json({
      success: true,
      translatedText: result.text?.trim() || content,
      isDraft: true,
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Error in /api/ai/translate:', error);
    res.status(500).json({ error: error.message || 'Gemini translation call failed', fallback: true });
  }
});

// 3. Summarize administrative case history
app.post('/api/ai/summarize-history', async (req: Request, res: Response) => {
  const { caseData, communications } = req.body;
  if (!caseData) {
    return res.status(400).json({ error: 'caseData is required' });
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    return res.json({
      fallback: true,
      message: 'AI service not configured on server; fallback engine should be used.'
    });
  }

  try {
    const prompt = `Summarize the administrative communication history and current barrier status for this screening case into 3-4 concise, factual bullet points for care coordinators. Do not invent any facts.\n\nCase Details: ${JSON.stringify(caseData)}\nRecent Communications: ${JSON.stringify(communications || [])}`;
    const result = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CLINICAL_SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.2,
      }
    });

    res.json({
      success: true,
      summary: result.text?.trim(),
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Error in /api/ai/summarize-history:', error);
    res.status(500).json({ error: error.message || 'Gemini summary call failed', fallback: true });
  }
});

// 4. Generate draft follow-up message using structured case info
app.post('/api/ai/draft-outreach', async (req: Request, res: Response) => {
  const { caseData, patientData, templateType, channel, language } = req.body;
  if (!caseData || !patientData) {
    return res.status(400).json({ error: 'caseData and patientData are required' });
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    return res.json({
      fallback: true,
      message: 'AI service not configured on server; fallback engine should be used.'
    });
  }

  try {
    const prompt = `Generate a draft follow-up message for:
Patient: ${patientData.firstName} ${patientData.lastName}
Preferred Language: ${language || patientData.preferredLanguage || 'English'}
Channel: ${channel || 'SMS'}
Template Purpose: ${templateType || 'Screening result follow-up'}
Clinician-Approved Next Action: ${caseData.nextAction}
Ordering Clinician: ${caseData.orderingPhysician}
Screening Test: ${caseData.testName}
Clinic Phone: (555) 700-CARE

Generate JSON with:
{
  "title": "Subject or title string",
  "body": "Message content string in the requested language"
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CLINICAL_SAFETY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(result.text || '{}');
    res.json({
      success: true,
      title: parsed.title,
      body: parsed.body,
      isDraft: true,
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Error in /api/ai/draft-outreach:', error);
    res.status(500).json({ error: error.message || 'Gemini draft call failed', fallback: true });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CareLoop Full-Stack Server running on port ${port}`);
  });
}

startServer();

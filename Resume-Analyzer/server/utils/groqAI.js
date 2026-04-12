import Groq from 'groq-sdk';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse'); // v1.1.1 — plain async function

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * AI Service: Groq Llama 3.3 
 * Uses text extraction + text-only prompt for fast, high-quality analysis.
 */

/**
 * analyzeResume — Send resume text to Groq AI and get structured JSON back.
 *
 * @param {Buffer} pdfBuffer - Raw file bytes (used as fallback if rawText missing)
 * @param {string} rawText   - Pre-extracted text from parser.service.js (preferred)
 */
const analyzeResume = async (pdfBuffer, rawText = null) => {
    try {
        // Use pre-extracted text if available, otherwise try to extract from buffer
        let resumeText = rawText;

        if (!resumeText && pdfBuffer) {
            try {
                const pdfData = await pdfParse(pdfBuffer);
                resumeText = pdfData.text;
            } catch (pdfErr) {
                console.warn('⚠️ pdf-parse failed, using utf-8 fallback');
                resumeText = pdfBuffer.toString('utf-8').substring(0, 3000);
            }
        }

        if (!resumeText || resumeText.trim().length < 30) {
            throw new Error('Could not extract readable text from the file.');
        }

        // Trim to stay within token limits (Llama 3.3 handles large contexts but let's be safe)
        const trimmedText = resumeText.substring(0, 8000);

        // Text-only prompt
        const prompt = `You are an expert HR Recruiter and ATS Specialist.
Analyze the resume text below and extract detailed structured information.
Respond with ONLY a valid JSON object that strictly follows this schema:

{
  "name": "Full Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "summary": "Professional summary",
  "skills": {
    "hard": ["Strictly extract ALL programming languages, frameworks, frontend, backend, architectures, and hard skills. NOTE: Carefully distinguish between 'Java' and 'JavaScript' — they are NOT the same. Only extract 'Java' if it specifically refers to the Java language (not just Javascript)."],
    "soft": ["Extract ALL soft skills found"],
    "tools": ["Extract ALL databases, IDEs, Git, cloud platforms, and other tools found. NOTE: Distinguish between 'SQL' and 'NoSQL' databases."]
  },
  "experience": [
    {
      "company": "Company Name (Must be an actual employer/company. Do NOT include 'Personal Projects', 'Academic Projects', or 'Student Clubs')",
      "title": "Job Title (Only include actual employed roles. Exclude 'Student', 'Learner', or self-assigned project roles)",
      "location": "City, State",
      "startDate": "YYYY-MM-DD or Year (MUST extract, default to '2020-01-01' if unsure but role implies experience)",
      "endDate": "YYYY-MM-DD or 'Present' (MUST extract)",
      "durationInYears": <approximate number of years for this role, e.g., 1.5, 2.0, 0.5 (CRITICAL TO ESTIMATE)>,
      "description": "Responsibilities and achievements"
    }
  ],
  "education": [
    {
      "institution": "University Name or School Name",
      "degree": "Degree Name (e.g. B.Tech, SSC, Intermediate, M.S.)",
      "field": "Field of Study (e.g. Computer Science, ECE)",
      "percentage": "Extract percentage or GPA if available (e.g. 85%, 8.5 GPA)",
      "startDate": "Year",
      "endDate": "Year"
    }
  ],
  "score": <integer 0-100 representation of overall professional quality/completeness>,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestedJobs": ["string"],
  "missingSkills": ["string"]
}

RESUME TEXT:
"""
${trimmedText}
"""`;

        // Generate content with retry logic
        let responseText = '';
        let retries = 3;
        let delay = 2000;

        while (retries > 0) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are an ATS analysis AI that only outputs valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' },
                    temperature: 0
                });

                responseText = completion.choices[0]?.message?.content || '';
                break; // success
            } catch (err) {
                if (err.status === 429 || err.status === 503) {
                    console.warn(`⚠️ Groq busy (${err.status}), retrying in ${delay/1000}s... (${retries} left)`);
                    await new Promise(res => setTimeout(res, delay));
                    retries--;
                    delay *= 2; 
                    if (retries === 0) throw err;
                } else {
                    throw err;
                }
            }
        }

        console.log('✅ GROQ ANALYSIS COMPLETE');

        return JSON.parse(responseText.trim());

    } catch (error) {
        console.error('❌ AI Analysis Error:', error.message);
        throw new Error(`AI Process failed: ${error.message}`);
    }
};

export default analyzeResume;


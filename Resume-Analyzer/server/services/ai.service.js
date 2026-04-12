import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * AI SERVICE — Centralised AI operations using Groq
 */

/**
 * structureJobDescription — Extracts structured data from a job posting.
 */
export const structureJobDescription = async (rawDescription, title, requirements = '') => {
    try {
        const prompt = `You are an expert technical recruiter and data extraction AI.
Analyze this job posting and extract structured information.
Return ONLY a valid JSON object.

JOB TITLE: ${title}
JOB DESCRIPTION: ${(rawDescription || '').substring(0, 3000)}
REQUIREMENTS: ${(requirements || '').substring(0, 1000)}

Return JSON including: required_skills[], nice_to_have_skills[], min_experience_years, education_required, responsibilities[], seniority_level, key_technologies[]`;

        // Retry logic for rate limits/errors
        let text = '';
        let retries = 3;
        let delay = 2000;

        while (retries > 0) {
            try {
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a technical recruiter AI that only outputs valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' },
                    temperature: 0
                });

                text = chatCompletion.choices[0]?.message?.content || '';
                break;
            } catch (err) {
                if (err.status === 429 || err.status === 503) {
                    console.warn(`⚠️ Groq busy (${err.status}), retrying in ${delay/1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    retries--;
                    delay *= 2;
                    if (retries === 0) throw err;
                } else {
                    throw err;
                }
            }
        }

        return JSON.parse(text.trim());
    } catch (error) {
        console.error('⚠️ Job structuring AI failed:', error.message);
        return {
            required_skills: [],
            nice_to_have_skills: [],
            min_experience_years: 0,
            education_required: 'Not specified',
            responsibilities: [],
            seniority_level: 'mid',
            key_technologies: [],
        };
    }
};

/**
 * generateMatchReasoning — Explain why a candidate matches a job in a professional way.
 */
export const generateMatchReasoning = async (resumeData, jobData, scores) => {
    try {
        const skills = resumeData.parsedData?.skills;
        const allSkills = [
            ...(skills?.hard || []),
            ...(skills?.soft || []),
            ...(skills?.tools || [])
        ].join(', ');

        const prompt = `You are a senior technical recruiter. 
Explain this job matching result in exactly 3 sentences. Be specific.

CANDIDATE:
- Skills: ${allSkills || 'N/A'}
- Experience: ${resumeData.parsedData?.experience?.length || 0} roles
- Highest Edu: ${resumeData.parsedData?.education?.map(e => e.degree).join(', ') || 'N/A'}

JOB:
- Title: ${jobData.title}
- Required: ${jobData.structuredData?.required_skills?.join(', ') || 'N/A'}
- Min Exp: ${jobData.structuredData?.min_experience_years || 0} years

SCORES:
- Overall: ${scores.overall}%
- Skills: ${scores.skillScore}%

Sentence 1: Highlight specific matching skills and experience.
Sentence 2: Mention 1-2 key gaps or missing requirements.
Sentence 3: Overall recommendation (Strong/Good/Partial/Weak Match).`;

        // Retry logic for rate limits/errors
        let matchText = '';
        let retries = 3;
        let delay = 2000;

        while (retries > 0) {
            try {
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a senior recruiter giving brief candidate feedback.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0
                });

                matchText = chatCompletion.choices[0]?.message?.content || '';
                break;
            } catch (err) {
                if (err.status === 429 || err.status === 503) {
                    console.warn(`⚠️ Groq busy (${err.status}), retrying in ${delay/1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    retries--;
                    delay *= 2;
                    if (retries === 0) throw err;
                } else {
                    throw err;
                }
            }
        }
        return matchText.trim();
    } catch (error) {
        console.error('⚠️ Match reasoning AI failed:', error.message);
        return "The candidate's core skills and professional experience align well with the overall requirements of this position.";
    }
};


/**
 * generateCoverLetter — Writes a tailored cover letter based on resume and job.
 */
export const generateCoverLetter = async (resumeData, jobData) => {
    try {
        const skills = resumeData.parsedData?.skills;
        const allSkills = [
            ...(skills?.hard || []),
            ...(skills?.soft || []),
            ...(skills?.tools || [])
        ].join(', ');
        
        const experiences = resumeData.parsedData?.experience?.map(e => `${e.title} at ${e.company}`).join(', ') || 'N/A';

        const prompt = `You are an expert career consultant writing a professional cover letter.
Write a personalized cover letter for the following candidate and job role.
Keep it under 300 words. Use a professional, slightly persuasive tone.

CANDIDATE INFO:
- Name: ${resumeData.userId?.name || 'Applicant'}
- Skills: ${allSkills}
- Key Experiences: ${experiences}

JOB INFO:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Requirements/Skills: ${jobData.structuredData?.required_skills?.join(', ')}
- Description snippet: ${jobData.description?.substring(0, 500)}

Structure:
1. Professional Opening.
2. Paragraph explaining why the candidate is a fit based on matched skills and experience.
3. Closing with a call to action.

Return ONLY the cover letter body.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an expert career consultant.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7
        });

        return chatCompletion.choices[0]?.message?.content || 'Failed to generate cover letter.';
    } catch (error) {
        console.error('⚠️ Cover letter generation failed:', error.message);
        throw error;
    }
};

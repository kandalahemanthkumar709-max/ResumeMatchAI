import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// pdf-parse v1.1.1 — simple function API, no class, no exports restrictions
const pdfParse = require('pdf-parse');

/**
 * PARSER SERVICE — Extract Raw Text from PDF and DOCX
 *
 * WHY DO WE NEED RAW TEXT?
 * AI models like Gemini work with text, not binary files.
 * Before we can ask Gemini "what skills does this person have?",
 * we must extract all the text from the PDF/DOCX first.
 *
 * Think of it like scanning a document → OCR → you get the text.
 * pdf-parse and mammoth do that OCR-equivalent step for us.
 *
 * PACKAGES:
 *   pdf-parse → reads PDF binary, extracts all text content
 *   mammoth   → reads DOCX binary, extracts clean text (or HTML)
 */

/**
 * parsePDF — Extract text from a PDF buffer
 *
 * pdf-parse options:
 *   max: 0 → parse ALL pages (0 means unlimited)
 *   version: 'v2.0.550' → specific pdfjs version (more stable)
 *
 * @param {Buffer} buffer - Raw bytes of the PDF file
 * @returns {string} The full text content of the PDF
 */
const parsePDF = async (buffer) => {
    try {
        // pdfParse(buffer) → returns { text, numpages, info, ... }
        const data = await pdfParse(buffer, { max: 0 });

        if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF appears to be empty or is a scanned image (no text layer found).');
        }

        return data.text;
    } catch (err) {
        if (err.message.includes('encrypted') || err.message.includes('password')) {
            throw new Error('PDF is password-protected. Please upload an unprotected version.');
        }
        if (err.message.includes('Invalid PDF')) {
            throw new Error('The PDF file appears to be corrupted or invalid.');
        }
        throw err; // Re-throw any other errors
    }
};

/**
 * parseDOCX — Extract text from a DOCX buffer
 *
 * mammoth options:
 *   extractRawText  → gives plain text only (no formatting). Best for AI.
 *   convertToHtml   → gives HTML with formatting (for display purposes).
 *
 * We use extractRawText because AI doesn't care about bold/italic —
 * it just needs the words to understand skills, experience, etc.
 *
 * @param {Buffer} buffer - Raw bytes of the DOCX file
 * @returns {string} The full text content of the DOCX
 */
const parseDOCX = async (buffer) => {
    const mammoth = require('mammoth');

    try {
        // mammoth.extractRawText expects { buffer } — an object with a buffer property
        const result = await mammoth.extractRawText({ buffer });

        if (!result.value || result.value.trim().length === 0) {
            throw new Error('DOCX file appears to be empty.');
        }

        // result.messages contains warnings (e.g. "unsupported element") - log but don't fail
        if (result.messages.length > 0) {
            console.warn('⚠️ DOCX parse warnings:', result.messages.map(m => m.message));
        }

        return result.value;
    } catch (err) {
        if (err.message.includes('corrupt') || err.message.includes('invalid')) {
            throw new Error('DOCX file appears to be corrupted or invalid.');
        }
        throw err;
    }
};

/**
 * parseResume — Main entry point for the parser service.
 *
 * Automatically picks the right parser based on the file's MIME type.
 *
 * @param {Buffer} fileBuffer - Raw bytes from multer (req.file.buffer)
 * @param {string} mimetype   - The file MIME type (req.file.mimetype)
 * @returns {string} Extracted raw text, ready to be sent to Gemini AI
 */
export const parseResume = async (fileBuffer, mimetype) => {
    if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Received an empty file buffer. The file may be corrupted.');
    }

    if (mimetype === 'application/pdf') {
        return await parsePDF(fileBuffer);
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await parseDOCX(fileBuffer);
    }

    throw new Error(`Unsupported file type: ${mimetype}. Only PDF and DOCX are accepted.`);
};

import multer from 'multer';
import path from 'path';

/**
 * Multer Configuration - High-Performance File Uploads
 * We use 'memoryStorage' because we only need the file temporarily 
 * while the AI reads it. We don't want to clutter our server disk!
 */

const storage = multer.memoryStorage();

// Modern Filter: Only allow PDF files!
const fileFilter = (req, file, cb) => {
    // Check if the file uploaded is actually a PDF
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        // Use a descriptive error message for the frontend
        cb(new Error('Invalid file type! Only PDF resumes are supported.'), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        // Limit file size to 2MB to save bandwidth/credits
        fileSize: 1024 * 1024 * 2
    }
});

export default upload;

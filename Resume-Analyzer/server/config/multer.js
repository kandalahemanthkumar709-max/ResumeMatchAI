import multer from 'multer';

/**
 * MULTER CONFIGURATION — File Upload Middleware
 *
 * multer is a Node.js middleware for handling multipart/form-data
 * (the encoding type used when uploading files via HTML forms or Axios).
 *
 * memoryStorage vs diskStorage:
 *   - diskStorage  → saves the file directly to your server's hard drive.
 *                    Bad for cloud deployments (Render, Railway, Heroku wipe the disk).
 *   - memoryStorage → keeps the file as a Buffer in RAM temporarily.
 *                    We then take that buffer and push it to Cloudinary ourselves.
 *                    No file ever touches our disk. ✅
 *
 * A Buffer is just a chunk of raw binary data (bytes) held in memory.
 * Think of it like a temporary box that holds your file's bytes.
 */

// memoryStorage keeps uploaded files in memory as Buffer objects
const storage = multer.memoryStorage();

/**
 * fileFilter — Controls WHICH files are accepted.
 *
 * Called automatically by multer for every upload attempt.
 * @param {Request} req    - Express request object
 * @param {Object}  file   - Info about the uploaded file (name, mimetype, etc.)
 * @param {Function} cb    - Callback: cb(error, acceptFile)
 *                           cb(null, true)  → accept the file
 *                           cb(null, false) → silently reject
 *                           cb(new Error()) → reject with error
 */
const fileFilter = (req, file, cb) => {
    // Allowed MIME types:
    //   application/pdf          → PDF files
    //   application/vnd.openxmlformats-officedocument.wordprocessingml.document → .docx files
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
        // Accept: pass null as error, true to accept
        cb(null, true);
    } else {
        // Reject with a descriptive error message
        cb(new Error('Only PDF and DOCX files are allowed!'), false);
    }
};

/**
 * The final multer upload instance.
 * limits.fileSize → max upload size in bytes. 5 * 1024 * 1024 = 5MB.
 */
const upload = multer({
    storage,          // use memoryStorage (files go to req.file.buffer)
    fileFilter,       // only allow PDF + DOCX
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

export default upload;

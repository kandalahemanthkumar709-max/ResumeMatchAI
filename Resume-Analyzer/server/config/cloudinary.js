import { v2 as cloudinary } from 'cloudinary';

/**
 * CLOUDINARY SETUP — Cloud File Storage
 *
 * Cloudinary is a cloud service that stores, transforms, and serves files
 * (images, PDFs, videos). We use it to store resume files permanently.
 *
 * WHERE TO GET YOUR KEYS:
 *   1. Sign up at https://cloudinary.com (free plan gives 25GB storage)
 *   2. Go to Dashboard → you'll see Cloud Name, API Key, API Secret
 *   3. Copy those values into your .env file
 *
 * Add these to server/.env:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */

// v2 is the current version of the Cloudinary SDK
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,  // always use HTTPS URLs
});

/**
 * uploadToCloudinary — Uploads a file buffer to Cloudinary
 *
 * WHY A BUFFER?
 * multer memoryStorage gives us req.file.buffer — that's the raw bytes
 * of the uploaded file sitting in RAM. We pipe those bytes directly to
 * Cloudinary instead of saving to disk first.
 *
 * @param {Buffer} fileBuffer  - The raw file bytes from multer
 * @param {string} fileName    - Original file name (used for display)
 * @param {string} mimetype    - MIME type to set resource_type correctly
 * @returns {Object} { url, publicId } - The Cloudinary URL and public_id
 */
export const uploadToCloudinary = (fileBuffer, fileName, mimetype) => {
    return new Promise((resolve, reject) => {
        // cloudinary.uploader.upload_stream pushes a stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'resumes',          // Organises files in a 'resumes' folder on Cloudinary
                resource_type: 'raw',       // 'raw' = non-image files (PDF, DOCX, etc.)
                public_id: `${Date.now()}-${fileName.replace(/\s+/g, '_')}`,
                use_filename: true,
                unique_filename: false,
            },
            (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload failed: ${error.message}`));
                } else {
                    // result.secure_url is the HTTPS link to the file
                    // result.public_id is needed later to delete the file
                    resolve({ url: result.secure_url, publicId: result.public_id });
                }
            }
        );

        // Push the buffer bytes into the upload stream
        // This is equivalent to piping a file read stream
        uploadStream.end(fileBuffer);
    });
};

/**
 * deleteFromCloudinary — Removes a file from Cloudinary by its public_id
 *
 * Always delete the file from Cloudinary when removing a resume from our DB,
 * otherwise orphaned files waste your storage quota.
 *
 * @param {string} publicId - The Cloudinary public_id stored in our Resume model
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
        // Log but don't crash — DB record should still be deleted even if CDN fails
        console.error('⚠️ Cloudinary delete failed:', error.message);
    }
};

export default cloudinary;

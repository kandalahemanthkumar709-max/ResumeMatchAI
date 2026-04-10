import API from '../services/api';

/**
 * RESUME API FUNCTIONS — Centralised API layer for resume operations
 *
 * Why centralise? 
 * Instead of writing axios.post(...) in every component, we define it once here.
 * If the URL changes, we only update ONE file.
 *
 * All functions use our API instance which:
 *  - Automatically adds the base URL (http://127.0.0.1:5000)
 *  - Automatically injects the JWT token from localStorage as an Auth header
 */

/**
 * uploadResume — Upload a resume file with an optional label
 *
 * FormData is how browsers send files over HTTP. 
 * You build a key-value map where some values can be File objects.
 * The 'Content-Type: multipart/form-data' header tells the server
 * that this isn't JSON — it's a file upload.
 *
 * onUploadProgress lets us track how many bytes have been sent,
 * so we can show a progress bar in the UI.
 *
 * @param {File}     file              - The File object from the input / dropzone
 * @param {string}   label             - User-defined name for the resume
 * @param {Function} onUploadProgress  - Callback for progress updates
 */
export const uploadResume = async (file, label = '', onUploadProgress) => {
    // FormData is the browser's way of packaging a file for HTTP upload
    const formData = new FormData();
    formData.append('resume', file);      // 'resume' must match multer's .single('resume')
    formData.append('label', label || file.name);

    const response = await API.post('/api/resumes/upload', formData, {
        headers: {
            // Override Content-Type so axios sends it as multipart form data
            // (By default axios sends JSON — we must explicitly change this for files)
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            // progressEvent.loaded = bytes uploaded so far
            // progressEvent.total  = total file size in bytes
            if (onUploadProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onUploadProgress(percent);
            }
        },
    });

    return response.data;
};

/**
 * getAllResumes — Fetch all resumes for the logged-in user
 * (rawText is excluded on the server side for performance)
 */
export const getAllResumes = async () => {
    const response = await API.get('/api/resumes');
    return response.data;
};

/**
 * getResumeById — Fetch a single resume with FULL data including raw text and AI parsed data
 * @param {string} id - MongoDB ObjectId of the resume
 */
export const getResumeById = async (id) => {
    const response = await API.get(`/api/resumes/${id}`);
    return response.data;
};

/**
 * deleteResume — Delete a resume from DB + Cloudinary
 * @param {string} id - MongoDB ObjectId of the resume to delete
 */
export const deleteResume = async (id) => {
    const response = await API.delete(`/api/resumes/${id}`);
    return response.data;
};

/**
 * setDefaultResume — Mark a resume as the default one for job applications
 * @param {string} id - MongoDB ObjectId of the resume to set as default
 */
export const setDefaultResume = async (id) => {
    const response = await API.patch(`/api/resumes/${id}/set-default`);
    return response.data;
};

/**
 * reanalyzeResume — Manually trigger AI extraction/scoring for a resume
 * (useful if a resume failed analysis on initial upload).
 * @param {string} id - MongoDB ObjectId of the resume to re-analyze
 */
export const reanalyzeResume = async (id) => {
    const response = await API.post(`/api/resumes/${id}/analyze`);
    return response.data;
};

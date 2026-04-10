import API from './api';

/**
 * Resume Service: Centralizing API Calls
 * It's cleaner to keep your API functions separate from your UI.
 */

// 1. Upload & Analyze Resume
export const uploadResume = async (file) => {
    // For file uploads, we must use FormData!
    const formData = new FormData();
    formData.append('resume', file); // 'resume' must match your Backend (multer)

    const response = await API.post('/api/resumes/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });

    return response.data;
}

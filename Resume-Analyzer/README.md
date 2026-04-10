# ResumeMatch AI — Comprehensive AI Resume Analyzer & Job Matching System

![Project Banner](https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2670)

ResumeMatch AI is a sophisticated MERN stack application designed to bridge the gap between job seekers and recruiters using the power of Google Gemini AI. It analyzes resumes, generates ATS scores, identifies skill gaps, and matches candidates to perfectly suited job postings with high precision.

## 🚀 Key Features

### For Job Seekers
- **AI Resume Analysis**: Upload your PDF/Docx and get an instant ATS score (0-100%).
- **Skill Gap Identification**: AI identifies specific missing skills for your target roles.
- **Smart Job Matching**: Instant match percentages for every job on the platform.
- **Analytics Dashboard**: Visualize your ATS score improvement and application funnel over time.
- **Application Tracker**: Manage your job hunt pipeline (Applied → Screening → Interview → Hire).

### For Recruiters
- **Precision Hiring**: Instantly see which candidates match your job requirements best.
- **Candidate Ranking**: Sort applicants by AI-calculated match scores (Saves hours of screening).
- **Hiring Analytics**: monitor conversion rates and top performing job postings.
- **Automated Notifications**: Keep candidates in the loop with status update emails.

## 🛠️ Tech Stack

- **Frontend**: React, Framer Motion, Recharts, Lucide React, Tailwind CSS.
- **Backend**: Node.js, Express, MongoDB (Aggregations), Redis (Caching).
- **AI Engine**: Google Generative AI (Gemini 2.5-flash).
- **Security**: Helmet.js, Express-Rate-Limit, Mongo Sanitize, JWT.
- **Storage**: Cloudinary (File storage & Resumes).
- **Email**: Nodemailer.

---

## 💻 Local Setup (Step-by-Step)

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Or MongoDB Atlas account)
- [Redis](https://redis.io/download/) (Optional, for caching)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/resume-match-ai.git
cd resume-match-ai
```

### 3. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/resume-analyzer
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
REDIS_URL=redis://127.0.0.1:6379 (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 5. Run the Application
In separate terminals:
```bash
# Start Backend
cd server
npm run dev

# Start Frontend
cd client
npm run dev
```

---

## 📊 API Documentation Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Create a new seeker/recruiter account |
| POST | `/api/resumes/upload` | Upload PDF and run AI Analysis |
| GET | `/api/resumes/:id/analyze` | Manually re-trigger AI Analysis (Retry) |
| GET | `/api/analytics/seeker` | Get dashboard stats for seekers (Cached) |
| GET | `/api/jobs` | List active jobs (with pagination) |
| GET | `/api/matches/for-job/:id` | Rank applicants for a specific job |

---

## 🛡️ Security & Optimization
- **Rate Limiting**: Protects against brute-force and AI API abuse.
- **NoSQL Injection**: Cleans inputs to prevent malicious MongoDB queries.
- **Standardized Error Handling**: Global middleware with dedicated Production logging (`logs/error.log`).
- **Redis Cache-Aside**: Analytics results are cached for 1 hour to ensure lightning-fast dashboard loads.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

Built with ❤️ by [Your Name]

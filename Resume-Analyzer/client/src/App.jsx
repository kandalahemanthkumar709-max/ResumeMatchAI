import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import Login from './pages/auth/Login'; 
import Register from './pages/auth/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import ChooseRole from './pages/auth/ChooseRole';
import { Resumes } from './pages/seeker/Resumes';
import { Jobs } from './pages/seeker/Jobs';
import { JobDetail } from './pages/seeker/JobDetail';
import { PostJob } from './pages/recruiter/PostJob';
import { RecruiterDashboard } from './pages/recruiter/Dashboard';
import { Matches } from './pages/seeker/Matches';
import { Candidates } from './pages/recruiter/Candidates';
import ApplicationTracker from './pages/seeker/ApplicationTracker';
import { CandidateDetail } from './pages/recruiter/CandidateDetail';
import SeekerAnalytics from './pages/seeker/Analytics';
import RecruiterAnalytics from './pages/recruiter/Analytics';
import NotificationsPage from './pages/Notifications';
import ProfilePage from './pages/Profile';

/**
 * App.jsx - The Heart of the Frontend
 * We use React Router v6 to define which "Page" to show 
 * depending on the URL in the browser.
 */

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load user if token exists in localStorage
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    // Router wraps everything so we can navigate between pages
    <Router>
      <Toaster position="top-right" />
      <Layout>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/choose-role" element={<ProtectedRoute skipRoleCheck={true}><ChooseRole /></ProtectedRoute>} />
            
            
             {/* Seeker-Only Routes (You must be logged in as a seeker to see these) */}
            <Route element={<ProtectedRoute allowedRoles={['seeker']} />}>
               <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/resumes" element={<Resumes />} />
               <Route path="/matches" element={<Matches />} />
               <Route path="/tracker" element={<ApplicationTracker />} />
               <Route path="/analytics" element={<SeekerAnalytics />} />
            </Route>

            {/* Shared Protected Routes (Accessible by both Seekers and Recruiters) */}
            <Route element={<ProtectedRoute />}>
               <Route path="/jobs" element={<Jobs />} />
               <Route path="/jobs/:id" element={<JobDetail />} />
               <Route path="/notifications" element={<NotificationsPage />} />
               <Route path="/profile" element={<ProfilePage />} />
            </Route>
            
            {/* Recruiter Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
               <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
               <Route path="/recruiter/jobs/new" element={<PostJob />} />
               <Route path="/recruiter/jobs/:jobId/edit" element={<PostJob />} />
               <Route path="/recruiter/jobs/:jobId/candidates" element={<Candidates />} />
               <Route path="/recruiter/applications/:id" element={<CandidateDetail />} />
               <Route path="/recruiter/analytics" element={<RecruiterAnalytics />} />
            </Route>

            {/* Redirects & Catch-alls */}
            <Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Layout>
    </Router>
  );
}

export default App;

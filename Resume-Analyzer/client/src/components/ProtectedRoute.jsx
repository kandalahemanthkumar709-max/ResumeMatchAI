import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

/**
 * PROTECTED ROUTE: The "Gatekeeper" of your frontend.
 * It checks if the user is logged in before letting them 
 * enter a private page (like the Dashboard).
 */

export function ProtectedRoute({ allowedRoles }) {
  // 1. Get the current Auth state from Redux!
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  // 2. WHILE LOADING: Show a nice spinner so the user 
  // doesn't see a blank screen while the token is being verified.
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-cyan-400 mb-4" size={40} />
        <p className="text-slate-400 animate-pulse text-sm">Verifying your entry...</p>
      </div>
    );
  }

  // 3. NOT LOGGED IN: If the token is fake or missing, 
  // kick them back to the Login page!
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 4. WRONG ROLE: Direct users back to their respective dashboards
  // if they try to access a page meant for another role.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 5. SUCCESS! Render the page they requested (<Outlet /> is the child page).
  return <Outlet />;
}

/**
 * RECRUITER ROUTE: A shorthand for recruiter-only pages.
 * Usage: <Route path="/jobs/create" element={<RecruiterRoute />} />
 */
export function RecruiterRoute() {
    return <ProtectedRoute allowedRoles={['recruiter', 'admin']} />;
}

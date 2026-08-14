import { Routes, Route, Navigate} from "react-router-dom";
import { Suspense, lazy } from "react";
import React from "react";
import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { getUserRole, hasPortalAccess } from "../utils/auth";

const HRManagementRoutes = lazy(() => import("./AdminFeatures/HRManagementRoutes"));

// Debug wrapper to log route changes
const RouteDebugger = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    console.log('📍 HR route:', window.location.pathname);
  }, [window.location.pathname]);
  return <>{children}</>;
};

function HRRoute() {
  // Check if user is HR
  const userRole = getUserRole();
  
  // Allow if HR by role OR granted human_resource portal
  if (!hasPortalAccess('human_resource', 'hr')) {
    return <Navigate to="/" replace />;
  }

  // HR only has access to Management portal (Human Resource Portal)
  // Accounts portal is now only for accountant role
  return (
    <Suspense fallback={<Loading />}>
      <RouteDebugger>
        <Routes>
          {/* Management Routes - matches /Management/* */}
          <Route 
            path="*" 
            element={
              <ErrorBoundary><HRManagementRoutes /></ErrorBoundary>
            } 
          />
        </Routes>
      </RouteDebugger>
    </Suspense>
  );
}

export default HRRoute;


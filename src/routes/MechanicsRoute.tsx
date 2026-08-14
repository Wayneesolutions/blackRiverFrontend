import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { getUserRole, hasPortalAccess } from "../utils/auth";

const MechanicsRoutes = lazy(() => import("./AdminFeatures/MechanicsRoutes"));

function MechanicsRoute() {
  const userRole = getUserRole();

  // Allow if mechanic by role OR granted mechanic portal
  if (!hasPortalAccess('mechanic', 'Maintenance Crew (Mechanics)')) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="*" element={<ErrorBoundary><MechanicsRoutes basePath="/mechanics" /></ErrorBoundary>} />
      </Routes>
    </Suspense>
  );
}

export default MechanicsRoute;


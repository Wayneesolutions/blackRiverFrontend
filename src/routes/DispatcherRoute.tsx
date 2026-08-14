import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import React from "react";
import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { getUserRole, hasPortalAccess } from "../utils/auth";

const DispatchRoutes = lazy(() => import("./AdminFeatures/DispatchRoutes"));
const GpsVehicleRoutes = lazy(() => import("./AdminFeatures/GpsVehicleRoutes"));

// Debug wrapper to log route changes
const RouteDebugger = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    console.log('📍 Dispatcher route:', window.location.pathname);
  }, [window.location.pathname]);
  return <>{children}</>;
};

function DispatcherRoute() {
  const location = useLocation();
  const userRole = getUserRole();

  const isGpsVehicleRoute = location.pathname.startsWith('/gpsvehicle');
  const hasDispatchAccess = hasPortalAccess('dispatch_load', 'dispatcher');
  const hasGpsAccess = hasPortalAccess('gps', 'dispatcher');

  // GPS route: allow if user has gps portal OR dispatch_load (dispatchers include GPS)
  // Dispatch route: require dispatch_load access
  if (isGpsVehicleRoute ? (!hasDispatchAccess && !hasGpsAccess) : !hasDispatchAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <RouteDebugger>
        <Routes>
          {/* Dispatch Routes - matches /dispatch/* */}
          <Route 
            path="*" 
            element={
              isGpsVehicleRoute ? (
                <ErrorBoundary><GpsVehicleRoutes /></ErrorBoundary>
              ) : (
                <ErrorBoundary><DispatchRoutes /></ErrorBoundary>
              )
            } 
          />
        </Routes>
      </RouteDebugger>
    </Suspense>
  );
}

export default DispatcherRoute;


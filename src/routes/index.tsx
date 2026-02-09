import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";
import DispatcherRoute from "./DispatcherRoute";
import HRRoute from "./HRRoute";
import AccountantRoute from "./AccountantRoute";
import FleetMaintenanceRoute from "./FleetMaintenanceRoute";
import ComplianceRoute from "./ComplianceRoute";
import SafetyOfficerRoute from "./SafetyOfficerRoute";
import InvoicePayment from "../pages/customer/InvoicePayment";
import PublicRoute from "../components/auth/PublicRoute";
import Loading from "../components/common/Loading";
import { useInactivityTimer } from "../hooks/useInactivityTimer";

const Login = lazy(() => import("../pages/admin/auth/Login"));
const Register = lazy(() => import("../pages/admin/auth/Register"));

const AppRoutes = () => {
  // Initialize inactivity timer for automatic logout after 1 hour of inactivity
  // This hook must be called inside Router context (which AppRoutes is)
  useInactivityTimer();

  return (

    <Routes>
      {/* Root route - show login page */}
      <Route 
        path="/" 
        element={
          <Suspense fallback={<Loading />}>
            <PublicRoute>
              <Login />
            </PublicRoute>
          </Suspense>
        } 
      />

      {/* Public registration route */}
      <Route 
        path="/register" 
        element={
          <Suspense fallback={<Loading />}>
            <PublicRoute>
              <Register />
            </PublicRoute>
          </Suspense>
        } 
      />

      <Route path='/superadmin/*' element={<SuperAdminRoute />}></Route>
      <Route path='/admin/*' element={<AdminRoute />}></Route>
      
      {/* Dispatcher routes (without /admin prefix) */}
      <Route path='/dispatch/*' element={<DispatcherRoute />}></Route>
      <Route path='/gpsvehicle/*' element={<DispatcherRoute />}></Route>
      
      {/* HR routes (without /admin prefix) */}
      <Route path='/Management/*' element={<HRRoute />}></Route>
      
      {/* Accountant routes (without /admin prefix) */}
      <Route path='/accounts/*' element={<AccountantRoute />}></Route>
      
      {/* Fleet Maintenance Manager routes (without /admin prefix) */}
      <Route path='/fleetmaintenance/*' element={<FleetMaintenanceRoute />}></Route>
      
      {/* Compliance Manager routes (without /admin prefix) */}
      <Route path='/compliance/*' element={<ComplianceRoute />}></Route>
      
      {/* Safety Officer routes (without /admin prefix) */}
      <Route path='/healthandsafety/*' element={<SafetyOfficerRoute />}></Route>
      
      {/* Public customer routes */}
      <Route path='/invoice/:invoiceId' element={<InvoicePayment />}></Route>

    </Routes>

  );
};

export default AppRoutes;

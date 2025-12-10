import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/healthSafety/Layout";
import Loading from "../../components/common/Loading";
import ErrorBoundary from "../../components/common/ErrorBoundary";

const HealthSafetyDashboard = lazy(() => import("../../pages/admin/health&safety/Dashboard"));
const IncidentsAccidents = lazy(() => import("../../pages/admin/health&safety/incidents-accidents/index"));
const InspectionsHazards = lazy(() => import("../../pages/admin/health&safety/inspections-hazards/index"));
const TrainingCertificates = lazy(() => import("../../pages/admin/health&safety/training-certificates/index"));
const PoliciesDocuments = lazy(() => import("../../pages/admin/health&safety/policies-documents/index"));
const CommitteeCAPA = lazy(() => import("../../pages/admin/health&safety/committee-capa/index"));
const ReportsAnalytics = lazy(() => import("../../pages/admin/health&safety/reports-analytics/index"));
const ComplianceRecords = lazy(() => import("../../pages/admin/health&safety/ComplianceRecords/index"));
const SafetyInspections = lazy(() => import("../../pages/admin/health&safety/SafetyInspections/index"));
const TruckingOperations = lazy(() => import("../../pages/admin/health&safety/TruckingOperations/index"));

function HealthSafetyRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ErrorBoundary><HealthSafetyDashboard /></ErrorBoundary>} />
          <Route path="health-safety-summary" element={<ErrorBoundary><HealthSafetyDashboard /></ErrorBoundary>} />
          <Route path="dashboard" element={<ErrorBoundary><HealthSafetyDashboard /></ErrorBoundary>} />
          <Route path="incidents-accidents" element={<ErrorBoundary><IncidentsAccidents /></ErrorBoundary>} />
          <Route path="inspections-hazards" element={<ErrorBoundary><InspectionsHazards /></ErrorBoundary>} />
          <Route path="training-certificates" element={<ErrorBoundary><TrainingCertificates /></ErrorBoundary>} />
          <Route path="policies-documents" element={<ErrorBoundary><PoliciesDocuments /></ErrorBoundary>} />
          <Route path="committee-capa" element={<ErrorBoundary><CommitteeCAPA /></ErrorBoundary>} />
          <Route path="reports-analytics" element={<ErrorBoundary><ReportsAnalytics /></ErrorBoundary>} />
          <Route path="compliance-records" element={<ErrorBoundary><ComplianceRecords /></ErrorBoundary>} />
          <Route path="safety-inspections" element={<ErrorBoundary><SafetyInspections /></ErrorBoundary>} />
          <Route path="trucking-operations" element={<ErrorBoundary><TruckingOperations /></ErrorBoundary>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default HealthSafetyRoutes;


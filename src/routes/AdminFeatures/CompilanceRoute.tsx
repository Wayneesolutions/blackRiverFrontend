import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/compilance/Layout"
import Loading from "../../components/common/Loading";
import ErrorBoundary from "../../components/common/ErrorBoundary";

const CompilanceDashboard = lazy(()=>import('../../pages/admin/compilance/Dashboard'))
const HosAndEld = lazy(()=>import('../../pages/admin/compilance/host/HosAndEld'))
const CvsaInspection = lazy(()=>import('../../pages/admin/compilance/cvsa/CvsaInspection'))
const MonthlyReport = lazy(()=>import('../../pages/admin/compilance/reports/MonthlyReport'))
const Tickets = lazy(()=>import('../../pages/admin/compilance/tickets/Tickets'))
const FuelReports = lazy(()=>import('../../pages/admin/dispatch/resources/fuel-reports/index'))
function CompilanceRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>

          <Route index element={<ErrorBoundary><CompilanceDashboard /></ErrorBoundary>} />
          <Route path="compilance-summary" element={<ErrorBoundary><CompilanceDashboard /></ErrorBoundary>} />
          <Route path="hos-eld" element={<ErrorBoundary><HosAndEld /></ErrorBoundary>} />
          <Route path="cvsa-inspection" element={<ErrorBoundary><CvsaInspection /></ErrorBoundary>} />
          <Route path="monthly-report" element={<ErrorBoundary><MonthlyReport /></ErrorBoundary>} />
          <Route path="tickets" element={<ErrorBoundary><Tickets /></ErrorBoundary>} />
          <Route path="fuel-reports" element={<ErrorBoundary><FuelReports /></ErrorBoundary>} />
          
        </Route>
      </Routes>
    </Suspense>
  )
}

export default CompilanceRoute
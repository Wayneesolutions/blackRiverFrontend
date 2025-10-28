import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/compilance/Layout"
import Loading from "../../components/common/Loading";

const CompilanceDashboard = lazy(()=>import('../../pages/admin/compilance/Dashboard'))
const VehicleDocument = lazy(()=>import('../../pages/admin/compilance/vehicle/VehicleDocument'))
const DriverDocumenet = lazy(()=>import('../../pages/admin/compilance/driver/DriverDocumenet'))
const HosAndEld = lazy(()=>import('../../pages/admin/compilance/host/HosAndEld'))
const CvsaInspection = lazy(()=>import('../../pages/admin/compilance/cvsa/CvsaInspection'))
const MonthlyReport = lazy(()=>import('../../pages/admin/compilance/reports/MonthlyReport'))
function CompilanceRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>

          <Route index element={<CompilanceDashboard />} />
          <Route path="compilance-summary" element={<CompilanceDashboard />} />
          <Route path="vehicle-documents" element={<VehicleDocument />} />
          <Route path="driver-documents" element={<DriverDocumenet />} />
          <Route path="hos-eld" element={<HosAndEld />} />
          <Route path="cvsa-inspection" element={<CvsaInspection />} />
          <Route path="monthly-report" element={<MonthlyReport />} />
          
        </Route>
      </Routes>
    </Suspense>
  )
}

export default CompilanceRoute
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/fleetMaintain/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/fleetMaintenance/index"));
const SpareParts = lazy(() => import("../../pages/admin/fleetMaintenance/sparePart/index"))
const CostReports = lazy(() => import("../../pages/admin/fleetMaintenance/costReport/index"))
const FleetUnits = lazy(() => import("../../pages/admin/fleetMaintenance/fleetUnits/index"))
const ComplianceDashboard = lazy(() => import("../../pages/admin/fleetMaintenance/complianceDashboard/index"))
const ScheduledServicesLog = lazy(() => import("../../pages/admin/fleetMaintenance/scheduledServicesLog/index"))
const GeneralRepairsLog = lazy(() => import("../../pages/admin/fleetMaintenance/generalRepairsLog/index"))
const RegulatorySafety = lazy(() => import("../../pages/admin/fleetMaintenance/regulatorySafety/index"))
const VehicleDocuments = lazy(() => import("../../pages/admin/driverManagement/VehicleDocuments"))
const FuelReports = lazy(()=>import('../../pages/admin/dispatch/resources/fuel-reports/index'))
const FleetInvoices = lazy(() => import("../../pages/admin/compilance/invoices"))

function FleetMaintainRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
               
                    <Route path="/spare-parts" element={<SpareParts />} />
                    <Route path="/vehicle-documents" element={<VehicleDocuments />} />
                    <Route path="/cost-reports" element={<CostReports />} />
                    <Route path="/fleet-units" element={<FleetUnits />} />
                    <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                    <Route path="/scheduled-services-log" element={<ScheduledServicesLog />} />
                    <Route path="/general-repairs-log" element={<GeneralRepairsLog />} />
                    <Route path="/regulatory-safety" element={<RegulatorySafety />} />
                    <Route path="/fuel-reports" element={<FuelReports />} />
                    <Route path="/invoices" element={<FleetInvoices />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default FleetMaintainRoutes
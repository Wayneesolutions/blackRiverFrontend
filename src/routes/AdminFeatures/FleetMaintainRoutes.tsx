import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/fleetMaintain/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/fleetMaintenance/index"));
const WorkOrder = lazy(() => import("../../pages/admin/fleetMaintenance/workOrder/index"))
const Schedule = lazy(() => import("../../pages/admin/fleetMaintenance/scheduling/index"))
const SpareParts = lazy(() => import("../../pages/admin/fleetMaintenance/sparePart/index"))
const Invoices = lazy(() => import("../../pages/admin/fleetMaintenance/invoices/index"))
const CostReports = lazy(() => import("../../pages/admin/fleetMaintenance/costReport/index"))
const FleetUnits = lazy(() => import("../../pages/admin/fleetMaintenance/fleetUnits/index"))
const ComplianceDashboard = lazy(() => import("../../pages/admin/fleetMaintenance/complianceDashboard/index"))
const ScheduledServicesLog = lazy(() => import("../../pages/admin/fleetMaintenance/scheduledServicesLog/index"))
const GeneralRepairsLog = lazy(() => import("../../pages/admin/fleetMaintenance/generalRepairsLog/index"))
const RegulatorySafety = lazy(() => import("../../pages/admin/fleetMaintenance/regulatorySafety/index"))

function FleetMaintainRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/work-orders" element={<WorkOrder />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/spare-parts" element={<SpareParts />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/cost-reports" element={<CostReports />} />
                    <Route path="/fleet-units" element={<FleetUnits />} />
                    <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                    <Route path="/scheduled-services-log" element={<ScheduledServicesLog />} />
                    <Route path="/general-repairs-log" element={<GeneralRepairsLog />} />
                    <Route path="/regulatory-safety" element={<RegulatorySafety />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default FleetMaintainRoutes
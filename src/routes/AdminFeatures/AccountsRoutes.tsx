import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/accounts/Layout";
import Loading from "../../components/common/Loading";

// Existing
const Dashboard = lazy(() => import("../../pages/admin/accounts/index"));
const Invoices = lazy(() => import("../../pages/admin/accounts/invoice/index"));
const Expenses = lazy(() => import("../../pages/admin/accounts/expenses/index"));
const Payroll = lazy(() => import("../../pages/admin/accounts/payroll/index"));
const DriverPayroll = lazy(() => import("../../pages/admin/accounts/driverpayroll/index"));

// New Pages
const AccountingConfig = lazy(() => import("../../pages/admin/accounts/config/index"));
const Settlements = lazy(() => import("../../pages/admin/accounts/settlements/index"));
const FleetMaintenance = lazy(() => import("../../pages/admin/accounts/fleet-maintenance/index"));
const ReceiptsNotes = lazy(() => import("../../pages/admin/accounts/receipts-notes/index"));
const TaxSetup = lazy(() => import("../../pages/admin/accounts/tax-setup/index"));

function AccountsRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>

                    {/* Default Dashboard */}
                    <Route index element={<Dashboard />} />

                    {/* Existing Routes */}
                    <Route path="/invoice" element={<Invoices />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/driverpayroll" element={<DriverPayroll />} />

                    {/* New Routes */}
                    <Route path="/config" element={<AccountingConfig />} />
                    <Route path="/settlements" element={<Settlements />} />
                    <Route path="/fleet-maintenance" element={<FleetMaintenance />} />
                    <Route path="/tax-setup" element={<TaxSetup />} />
                    <Route path="/receipts-notes" element={<ReceiptsNotes />} />
             

                </Route>
            </Routes>
        </Suspense>
    );
}

export default AccountsRoutes;

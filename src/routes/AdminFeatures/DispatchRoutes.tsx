import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/operations/index"));
const ServiceRate = lazy(() => import("../../pages/admin/dispatch/operations/service rate/index"))
const Dispatch = lazy(() => import("../../pages/admin/dispatch/operations/dispatch/index"))
const Scheduler = lazy(() => import("../../pages/admin/dispatch/operations/schedular/index"))
const OrderConfig = lazy(() => import("../../pages/admin/dispatch/operations/orderConfig/index"))

const DriversPage = lazy(() => import("../../pages/admin/dispatch/resources/drivers"))
const Vehicle = lazy(() => import("../../pages/admin/dispatch/resources/vehicles/index"))
const Trailers = lazy(() => import("../../pages/admin/dispatch/resources/trailers/index"))
const Fleets = lazy(() => import("../../pages/admin/dispatch/resources/fleet/index"))
const Vendors = lazy(() => import("../../pages/admin/dispatch/resources/vendors/index"))
const Contacts = lazy(() => import("../../pages/admin/dispatch/resources/contacts/index"))
const Places = lazy(() => import("../../pages/admin/dispatch/resources/places/index"))
const FuelReports = lazy(() => import("../../pages/admin/dispatch/resources/fuel-reports/index"))
const Issues = lazy(() => import("../../pages/admin/dispatch/resources/issues/index"))

const NavigatorApp = lazy(() => import("../../pages/admin/dispatch/settings/navigatorApp/index"))
const Invoices = lazy(() => import("../../pages/admin/dispatch/settings/payments/index"))
const Notifications = lazy(() => import("../../pages/admin/dispatch/settings/notifications/index"))
const Routing = lazy(() => import("../../pages/admin/dispatch/settings/routing/index"))

function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>

          <Route index element={<DispatchDashboard />} />
          <Route path="operations/dashboard" element={<DispatchDashboard />} />
          <Route path="operations/service-rates" element={<ServiceRate />} />
          <Route path="operations/dispatch" element={<Dispatch />} />
          <Route path="operations/scheduler" element={<Scheduler />} />
          <Route path="operations/order-config" element={<OrderConfig />} />

          <Route path="resources/drivers" element={<DriversPage />} />
          <Route path="resources/vehicles" element={<Vehicle />} />
          <Route path="resources/trailers" element={<Trailers />} />
          <Route path="resources/fleets" element={<Fleets />} />
          <Route path="resources/vendors" element={<Vendors />} />
          <Route path="resources/contacts" element={<Contacts />} />
          <Route path="resources/places" element={<Places />} />
          <Route path="resources/fuel-reports" element={<FuelReports />} />
          <Route path="resources/issues" element={<Issues />} />

          <Route path="settings/navigator-app" element={<NavigatorApp />} />
          <Route path="settings/payments" element={<Invoices />} />
          <Route path="settings/notifications" element={<Notifications />} />
          <Route path="settings/routing" element={<Routing />} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;
import { Routes, Route } from "react-router-dom";
import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";
import InvoicePayment from "../pages/customer/InvoicePayment";



const AppRoutes = () => {
  return (

    <Routes>

      <Route path='/superadmin/*' element={<SuperAdminRoute />}></Route>
      <Route path='/admin/*' element={<AdminRoute />}></Route>
      
      {/* Public customer routes */}
      <Route path='/invoice/:invoiceId' element={<InvoicePayment />}></Route>

    </Routes>

  );
};

export default AppRoutes;

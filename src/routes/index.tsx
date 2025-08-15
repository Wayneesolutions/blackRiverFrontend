import { Routes, Route } from "react-router-dom";
import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";



const AppRoutes = () => {
  return (

    <Routes>

      <Route path='/superadmin/*' element={<SuperAdminRoute />}></Route>
      <Route path='/admin/*' element={<AdminRoute />}></Route>

    </Routes>

  );
};

export default AppRoutes;

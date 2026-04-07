import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 pb-20 custom-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

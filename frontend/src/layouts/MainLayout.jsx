import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingBottomNav from "../components/FloatingBottomNav";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pb-20">
        <Outlet />
      </main>
      <FloatingBottomNav />
    </div>
  );
};

export default MainLayout;
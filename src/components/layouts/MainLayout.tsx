import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "../fragments/Navbar";

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="pt-10">
        <Outlet />
      </main>
      <Toaster position="top-center" />
    </div>
  );
};

export default MainLayout;
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import DesktopOnly from "./Pages/DesktopOnly";
import { Toaster } from "react-hot-toast";
import UploadQuestions from "./Pages/UploadQuestions";

const Login = lazy(() => import("./Pages/Login"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const QuestionPaperView = lazy(() => import("./Pages/QuestionPaperView"));
const SeedAdmin = lazy(() => import("./Pages/SeedAdmin"));

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
          },
        }}
      />
      {/* <DesktopOnly> */}
      <Suspense
        fallback={<div className="text-center mt-10">Loading...</div>}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/staff-portal" element={<UploadQuestions />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/view-paper/:id" element={<QuestionPaperView />} />
          <Route path="/seed" element={<SeedAdmin />} />
        </Routes>
      </Suspense>
      {/* </DesktopOnly> */}
    </>
  );
};

export default App;

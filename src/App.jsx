import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';

// Keep MainLayout static if you want the shell to load immediately, 
// or lazy load it as well. Usually, keeping layout static is better for UX.
import MainLayout from "./components/ui/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// 1. Convert static imports to React.lazy imports
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Cart = lazy(() => import("./pages/Cart"));
const Search = lazy(() => import("./pages/Search"));
const AdminDashboard = lazy(() => import("./dashboards/AdminDashboard"));
const PageNotFound = lazy(() => import("./pages/PageNotFound"));
const UserDashboard = lazy(() => import("./dashboards/UserDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// 2. Create a loading fallback component (using Bootstrap classes)
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
</div>
);

function App() {
  return (
    // 3. Wrap Routes in Suspense with the fallback
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Routes WITH Navbar & Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admindashboard" element={<AdminDashboard/>} />
          <Route path="/userdashboard" element={<UserDashboard/>} />
        </Route>

        {/* Routes WITHOUT Navbar & Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ToastContainer />
    </Suspense>
  );
}

export default App;
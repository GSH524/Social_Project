import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { setProfile, logout } from './slices/userSlice';

import MainLayout from "./components/ui/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy Imports
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

// --- ADDED THESE MISSING IMPORTS ---
const Shipping = lazy(() => import("./pages/Shipping"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess")); 

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

function App() {
  const dispatch = useDispatch();

  // --- SYNC FIREBASE AUTH WITH REDUX ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. User is signed in, fetch extra details from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let userData = {};
        if (docSnap.exists()) {
          userData = docSnap.data();
        }

        // 2. Dispatch to Redux
        dispatch(setProfile({
          uid: user.uid,
          email: user.email,
          fullname: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(), // Combined name
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          mobile: userData.mobile || '',
          address: userData.address || '',
          profileImage: userData.profileImage || ''
        }));
      } else {
        // 3. User is signed out, clear Redux
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* --- Checkout Routes --- */}
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-success" element={<OrderSuccess />} />

          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/userdashboard" element={<UserDashboard />} />
        </Route>

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
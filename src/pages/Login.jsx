import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserCircle, FaLock, FaEnvelope } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const provider = new GoogleAuthProvider();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  
  // --- ROLES CONFIGURATION ---
  const Admin_email = import.meta.env.Admin_email; // Keep your existing Env variable
  const SuperAdmin_email = "gudipatisrihari6@gmail.com"; // Hardcoded Super Admin

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Helper to handle routing based on email
  const handleRedirect = (userEmail) => {
    if (userEmail === SuperAdmin_email) {
      navigate("/superadmindashboard");
    } else if (userEmail === Admin_email) {
      navigate("/admindashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Login Successful! Redirecting...", {
        position: "top-right",
        autoClose: 1500,
        theme: "dark",
      });

      setTimeout(() => {
        handleRedirect(email);
      }, 1500);

    } catch (err) {
      setError("Invalid email or password");
      toast.error("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          fullName: user.displayName,
          firstName: user.displayName ? user.displayName.split(' ')[0] : "User",
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : "",
          email: user.email,
          profileImage: user.photoURL,
          mobile: "", 
          address: "",
          city: "",
          country: "",
          createdAt: new Date(),
          authProvider: "google"
        });
      }

      toast.success("Google Login Successful!", {
        position: "top-right",
        autoClose: 1500,
        theme: "dark",
      });

      setTimeout(() => {
        handleRedirect(user.email);
      }, 1500);

    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return; 
      setError("Google login failed. Please try again.");
      toast.error("Google login failed.");
      console.error(err);
    }
  };

  const bgStyle = {
    background: `
      radial-gradient(circle at 20% 20%, rgba(65, 20, 60, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(30, 30, 80, 0.8) 0%, transparent 50%),
      linear-gradient(135deg, #2b102f 0%, #151525 100%)
    `,
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden"
      style={bgStyle}
    >
      <ToastContainer />

      <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-[25px] border border-white/10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 md:p-10 relative overflow-hidden animate-[fadeUp_0.8s_ease-out]">
        
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

        <div className="text-center mb-8 sm:mb-10 relative z-10">
          <FaUserCircle className="text-[60px] sm:text-[80px] text-white/30 mx-auto drop-shadow-md transition-transform duration-500 hover:scale-105" />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-xs sm:text-sm p-3 mb-5 text-center relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10">
          
          <div className="relative mb-6 sm:mb-8 flex items-center border-b border-white/40 transition-colors duration-300 focus-within:border-white">
            <span className="text-white text-lg mr-3 sm:mr-4 pb-2"><FaEnvelope /></span>
            <input
              type="email"
              className="w-full bg-transparent border-none outline-none text-white pb-2 text-sm sm:text-base placeholder-white/70 font-light"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative mb-6 sm:mb-8 flex items-center border-b border-white/40 transition-colors duration-300 focus-within:border-white">
            <span className="text-white text-lg mr-3 sm:mr-4 pb-2"><FaLock /></span>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-transparent border-none outline-none text-white pb-2 text-sm sm:text-base placeholder-white/70 font-light"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="text-white/70 cursor-pointer pb-2 ml-3 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 text-xs sm:text-sm gap-3 sm:gap-0 relative z-10">
            <div className="flex items-center group">
              <input 
                className="appearance-none w-4 h-4 border border-white/50 rounded bg-white checked:bg-white checked:border-white cursor-pointer mr-2 relative after:content-['✓'] after:absolute after:text-black after:text-xs after:left-[2px] after:top-[-1px] after:hidden checked:after:block transition-all"
                type="checkbox" 
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-white font-light cursor-pointer select-none group-hover:text-white/90" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-white/50 hover:text-white font-light italic transition-colors ml-auto sm:ml-0"
              onClick={() => navigate("/reset")}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#4b1d58] to-[#3a3a8a] text-white py-3 rounded-full font-semibold tracking-[1.5px] uppercase shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:from-[#5e246e] hover:to-[#4a4ab5] mb-4 text-sm sm:text-base"
          >
            LOGIN
          </button>
        </form>

        <div className="text-center mt-4 relative z-10">
            <p className="text-white/50 mb-4 text-xs sm:text-sm">Or login with</p>
            <button
              type="button"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/30 text-white flex items-center justify-center mx-auto hover:bg-white/10 hover:border-white transition-all duration-300 group"
              onClick={handleGoogleLogin}
              title="Sign in with Google"
            >
              <FaGoogle className="text-sm sm:text-base group-hover:scale-110 transition-transform" />
            </button>
        </div>

        <p className="text-center mt-6 mb-0 text-white/50 text-xs sm:text-sm relative z-10">
          Don't have an account? <Link to="/signup" className="text-white font-bold ml-1 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
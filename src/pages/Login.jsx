import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth } from "../firebase"; // Ensure this path is correct
import "../pages/Login.css"
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserCircle, FaLock, FaEnvelope } from "react-icons/fa";

const provider = new GoogleAuthProvider();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Email & Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Set persistence based on remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      // Check specific email for admin routing
      if (email === "harigudipati666@gmail.com") {
        navigate("/admindashboard");
      } else {
        navigate("/userdashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setError("");
    try {
      // Set persistence based on remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      if (userEmail === "harigudipati666@gmail.com") {
        navigate("/admindashboard");
      } else {
        navigate("/userdashboard");
      }
    } catch (err) {
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        {/* Profile Icon Section */}
        <div className="profile-section">
          <FaUserCircle className="profile-icon" />
        </div>

        {error && <div className="alert alert-danger custom-alert">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          
          {/* Email Input */}
          <div className="input-group">
            <span className="input-icon">
              <FaEnvelope />
            </span>
            <input
              type="email"
              className="form-control underline-input"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <span className="input-icon">
              <FaLock />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control underline-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Toggle Password Eye */}
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="d-flex justify-content-between align-items-center mb-4 options-row">
            <div className="form-check">
              <input 
                className="form-check-input custom-checkbox" 
                type="checkbox" 
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label text-white" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="btn btn-link text-white-50 text-decoration-none p-0 forgot-link"
              onClick={() => navigate("/reset")}
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn btn-gradient-primary w-100 mb-3">
            LOGIN
          </button>
        </form>

        {/* Divider & Google Login (Kept from your logic) */}
        <div className="text-center mt-3">
            <p className="text-white-50 mb-3" style={{fontSize: '0.9rem'}}>Or login with</p>
            <button
            type="button"
            className="btn btn-outline-light rounded-circle p-2 google-btn"
            onClick={handleGoogleLogin}
            title="Sign in with Google"
            >
            <FaGoogle />
            </button>
        </div>

        <p className="text-center mt-4 mb-0 text-white-50" style={{fontSize: '0.9rem'}}>
          Don't have an account? <Link to="/signup" className="text-white fw-bold text-decoration-none">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
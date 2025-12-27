import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setInfo("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);

      // ✅ Secure message (does not expose account existence)
      setInfo(
        "If an account exists for this email, a password reset link has been sent."
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page-bg">
      <div className="glass-card">
        {/* Header Icon */}
        <div className="icon-header">
          <div className="icon-circle">
            <FaLock />
          </div>
        </div>

        <h2>Forgot Password?</h2>
        <p className="sub-text">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {/* Alerts */}
        {error && (
          <div className="alert-box error">
            <FaExclamationCircle /> {error}
          </div>
        )}

        {info && (
          <div className="alert-box success">
            <FaCheckCircle /> {info}
          </div>
        )}

        <form onSubmit={handleReset} className="reset-form">
          <div className="input-group-underline">
            <span className="input-icon">
              <FaEnvelope />
            </span>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="gradient-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="reset-footer">
          <Link to="/login" className="back-link">
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useState } from "react";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
// ✅ Added specific icons for the new UI
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCamera } from "react-icons/fa";
import "./Signup.css";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(""); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800 * 1024) {
        setError("Image size is too large. Please select an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes("google.com")) {
        setError("This email is registered with Google. Please login with Google.");
        return;
      }
      if (methods.includes("password")) {
        setError("Email already registered. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        mobile,
        address,
        password, // Note: Storing plain text password is not recommended for production
        confirmPassword,
        profileImage: image,
        createdAt: new Date(),
      });

      setShowToast(true);
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-page-bg">
      <div className="glass-card">
        
        <h2>Create Account</h2>
        <p className="sub-text">Join us to get started</p>

        {error && <div className="error-message">{error}</div>}

        {showToast && (
          <div className="toast-notification">
            Signup successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
          
          {/* Profile Picture Upload (Circular) */}
          <div className="profile-upload-section">
            <label htmlFor="file-upload" className="profile-circle">
              {image ? (
                <img src={image} alt="Profile" className="profile-preview" />
              ) : (
                <div className="profile-placeholder">
                  <FaCamera />
                  <span>Upload</span>
                </div>
              )}
            </label>
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </div>

          {/* Full Name */}
          <div className="input-group-underline">
            <span className="input-icon"><FaUser /></span>
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          {/* Email */}
          <div className="input-group-underline">
            <span className="input-icon"><FaEnvelope /></span>
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* Mobile */}
          <div className="input-group-underline">
            <span className="input-icon"><FaPhone style={{transform: 'scaleX(-1)'}}/></span>
            <input type="tel" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </div>

          {/* Address */}
          <div className="input-group-underline">
            <span className="input-icon"><FaMapMarkerAlt /></span>
            <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          {/* Password */}
          <div className="input-group-underline">
            <span className="input-icon"><FaLock /></span>
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="input-group-underline">
            <span className="input-icon"><FaLock /></span>
            <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <span className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="gradient-btn">SIGN UP</button>
        </form>

        <div className="signup-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
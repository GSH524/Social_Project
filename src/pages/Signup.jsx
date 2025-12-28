import { useState } from "react";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, 
  FaMapMarkerAlt, FaLock, FaCamera, FaGlobe, FaBuilding 
} from "react-icons/fa";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
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
        firstName,
        lastName,
        email,
        mobile,
        address,
        city,
        country,
        password, // Not recommended for production
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

  // Custom Gradient Background Style (Tailwind utilities for complex radial gradients are limited)
  const bgStyle = {
    background: `
      radial-gradient(at top left, #4a2c44 0%, transparent 50%),
      radial-gradient(at top right, #3a2a52 0%, transparent 50%),
      radial-gradient(at bottom left, #56324a 0%, transparent 50%),
      radial-gradient(at bottom right, #2e2e5e 0%, transparent 50%),
      #2b213a`
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans p-6 box-border text-white" style={bgStyle}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 bg-emerald-500/90 text-white px-6 py-4 rounded-xl shadow-2xl z-50 font-semibold animate-bounce">
          Signup successful! Redirecting...
        </div>
      )}

      {/* Glassmorphism Card */}
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[30px] p-8 md:p-10 text-center relative overflow-hidden">
        
        <h2 className="text-3xl font-bold mb-1 tracking-wide">Create Account</h2>
        <p className="text-white/70 text-sm mb-8">Join us to get started</p>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-6 text-sm border border-red-500/40 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          
          {/* Profile Picture Upload */}
          <div className="flex justify-center mb-2">
            <label htmlFor="file-upload" className="w-24 h-24 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 bg-black/20 hover:border-white hover:bg-white/10 hover:scale-105 group relative">
              {image ? (
                <img src={image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/70 text-xs group-hover:text-white transition-colors">
                  <FaCamera className="text-2xl mb-1" />
                  <span>Upload</span>
                </div>
              )}
            </label>
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Input Fields Container */}
          <div className="space-y-5">
            
            {/* First Name */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaUser /></span>
              <input 
                type="text" 
                placeholder="First Name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Last Name */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaUser /></span>
              <input 
                type="text" 
                placeholder="Last Name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Email */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaEnvelope /></span>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Mobile */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center transform -scale-x-100 group-focus-within:text-white"><FaPhone /></span>
              <input 
                type="tel" 
                placeholder="Mobile Number" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Address */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaMapMarkerAlt /></span>
              <input 
                type="text" 
                placeholder="Address (e.g. KPHB Hyderabad)" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* City */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaBuilding /></span>
              <input 
                type="text" 
                placeholder="City" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Country */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaGlobe /></span>
              <input 
                type="text" 
                placeholder="Country" 
                value={country} 
                onChange={(e) => setCountry(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
            </div>

            {/* Password */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaLock /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
              <span className="cursor-pointer text-white/70 hover:text-white ml-2 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Confirm Password */}
            <div className="relative flex items-center border-b border-white/40 pb-2 transition-colors duration-300 focus-within:border-white group">
              <span className="text-white/80 mr-4 text-lg w-6 flex justify-center group-focus-within:text-white"><FaLock /></span>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-white/60"
              />
              <span className="cursor-pointer text-white/70 hover:text-white ml-2 transition-colors" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

          </div>

          <button 
            type="submit" 
            className="mt-6 w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 text-white text-lg font-bold shadow-[0_5px_15px_rgba(37,117,252,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,117,252,0.6)] active:translate-y-0 tracking-wide"
          >
            SIGN UP
          </button>
        </form>

        <div className="mt-8 text-sm text-white/80">
          Already have an account? <Link to="/login" className="text-blue-200 font-bold ml-1 hover:text-white hover:underline transition-colors">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
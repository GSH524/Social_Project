import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // ✅ Import Firestore functions
import { auth, db } from '../../firebase'; // ✅ Import db
import { FaUser, FaSearch, FaShoppingCart, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import "./Navbar.css";

const Navbar = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null); // ✅ State to store DB Image
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const totalQuantity = useSelector(state => state.cart.totalQuantity);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuth(!!user);

      if (user) {
        localStorage.setItem("isAuthenticated", "true");
        
        // ✅ Fetch User Profile Image from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // Get the 'profileImage' field we saved during signup
            setProfileImage(docSnap.data().profileImage);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }

      } else {
        localStorage.removeItem("isAuthenticated");
        setProfileImage(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setShowDropdown(false);
    setIsAuth(localStorage.getItem("isAuthenticated") === "true");
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAuthenticated");
      setIsAuth(false);
      setShowDropdown(false);
      setProfileImage(null); // Clear image on logout
      navigate("/");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <nav className="navbar navbar-expand-lg sticky-top">
      <div className="container-fluid px-4">

        {/* Logo */}
        <Link className="navbar-brand" to="/" onClick={() => setIsOpen(false)}>
           <div className="logo-text">GSH-The Perimum Store</div>
        </Link>

        {/* Mobile Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Collapsible Content */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>

          {/* Main Navigation */}
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/")}`} to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/about")}`} to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/contact")}`} to="/contact">Contact</Link>
            </li>
          </ul>

          {/* Right Actions */}
          <div className="navbar-actions">

            {/* Search */}
            <form className="search-box" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit"><FaSearch /></button>
            </form>

            {/* Cart */}
            <Link to="/cart" className="icon-btn cart-btn">
              <FaShoppingCart />
              {totalQuantity > 0 && <span className="badge">{totalQuantity}</span>}
            </Link>

            {/* User Dropdown */}
            {isAuth ? (
              <div className="user-dropdown-container">
                <button className="icon-btn user-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  {/* ✅ Show Profile Image from DB if available, else fallback to Icon */}
                  {profileImage ? (
                    <img src={profileImage} alt="User" className="avatar" />
                  ) : (
                    <FaUser />
                  )}
                </button>

                {showDropdown && (
                  <div className="dropdown-menu-custom">
                    <div className="dropdown-header">
                      <strong>{currentUser?.displayName || currentUser?.email || 'User'}</strong>
                    </div>
                    <div className="dropdown-divider"></div>
                    
                    {currentUser?.email === "harigudipati666@gmail.com" ? (
                      <Link to="/admindashboard" className="dropdown-item text-white p-2">Admin Dashboard</Link>
                    ) : (
                      <Link to="/userdashboard" className="dropdown-item text-white p-2">My Dashboard</Link>
                    )}
                    
                    
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate("/login")} className="icon-btn login-btn">
                <FaUser />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
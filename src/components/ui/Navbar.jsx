import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '../../firebase'; 
import { FaUser, FaSearch, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const totalQuantity = useSelector(state => state.cart.totalQuantity);

  // --- Auth & Data Logic ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuth(!!user);
      if (user) {
        localStorage.setItem("isAuthenticated", "true");
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setProfileImage(docSnap.data().profileImage);
        } catch (error) { console.error(error); }
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
  }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">

          {/* 1. LOGO */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                GSH<span className="text-blue-500">.</span>STORE
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1">
                Premium Collection
              </span>
            </div>
          </Link>

          {/* 2. CENTER SEARCH BAR (Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="w-full relative flex items-center">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-full pl-5 pr-12 py-2.5 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors"
              >
                <FaSearch size={14} />
              </button>
            </form>
          </div>

          {/* 3. NAVIGATION LINKS (Desktop) */}
          <div className="hidden lg:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          {/* 4. ICONS & ACTIONS */}
          <div className="flex items-center gap-5">
            
            {/* Mobile Search Toggle */}
            <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
              <FaSearch size={20} />
            </button>

            {/* Cart Icon */}
            <Link to="/cart" className="relative group text-slate-300 hover:text-white transition-colors">
              <FaShoppingCart size={22} />
              {totalQuantity > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* User Profile Logic */}
            {isAuth ? (
              // --- LOGGED IN STATE (Profile Picture) ---
              <div className="relative hidden md:block">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                   <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-600 hover:border-blue-500 transition-all">
                      {profileImage ? (
                        <img src={profileImage} alt="User" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">
                           <FaUser size={14} />
                        </div>
                      )}
                   </div>
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-sm animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-slate-700">
                       <p className="text-slate-400 text-xs">Signed in as</p>
                       <p className="text-white font-medium truncate">{currentUser?.email}</p>
                    </div>
                    
                    <Link to={currentUser?.email === "harigudipati666@gmail.com" ? "/admindashboard" : "/userdashboard"} 
                          className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">
                       Dashboard
                    </Link>
                    
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700 hover:text-red-300">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // --- NOT LOGGED IN STATE (User Icon) ---
              <button 
                onClick={() => navigate("/login")} 
                className="hidden md:block text-slate-300 hover:text-white transition-colors"
                title="Login / Register"
              >
                 <FaUser size={22} />
              </button>
            )}

            {/* Mobile Hamburger */}
            <button className="md:hidden text-slate-300" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 pt-4 pb-6 space-y-4">
            
            <form onSubmit={handleSearch} className="flex items-center">
               <input 
                 type="text" 
                 placeholder="Search..." 
                 className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm border border-slate-700 outline-none focus:border-blue-500"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </form>

            <div className="flex flex-col space-y-1">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Home</Link>
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">About</Link>
              <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Contact</Link>
            </div>

            <div className="border-t border-slate-700 pt-4">
              {isAuth ? (
                <div className="flex items-center gap-3 px-3">
                  <div className="h-10 w-10 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
                    {profileImage ? <img src={profileImage} alt="profile" className="w-full h-full object-cover"/> : <FaUser className="text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-white truncate">{currentUser?.email}</div>
                    <Link to={currentUser?.email === "harigudipati666@gmail.com" ? "/admindashboard" : "/userdashboard"} className="text-sm text-blue-400 hover:text-blue-300 block">View Dashboard</Link>
                  </div>
                  <button onClick={handleLogout} className="text-red-400 text-sm hover:text-red-300">Logout</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 px-3">
                   <Link to="/login" className="text-center py-2 bg-slate-700 text-white rounded hover:bg-slate-600 font-medium">Login</Link>
                   <Link to="/signup" className="text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-medium">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
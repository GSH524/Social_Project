import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, getDoc, collection, query, where, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db } from '../../firebase'; 
import { FaUser, FaSearch, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';
import { clearCart, setCart } from "../../slices/cartSlice";

// --- TOAST IMPORTS ---
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ICONS FOR NOTIFICATIONS ---
import { Bell, X, Check, AlertCircle, Loader, Ticket, Package, Info } from 'lucide-react';

// ==========================================
//  INTERNAL COMPONENT: NAVBAR NOTIFICATIONS
// ==========================================
const NavbarNotifications = ({ user, isAdmin, onUpdateData }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Notifications based on Role
  useEffect(() => {
    if (!user) return;
    
    let q;
    if (isAdmin) {
      // Admin gets all admin-type notifications
      q = query(collection(db, "notifications"), where("type", "==", "admin"));
    } else {
      // Users get: 
      // 1. Direct messages (recipientId == user.uid)
      // 2. Broadcasts (recipientId == "all") like Coupons
      q = query(
        collection(db, "notifications"), 
        where("recipientId", "in", [user.uid, "all"])
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter out admin types for normal users just in case
      const filteredNotes = isAdmin ? notes : notes.filter(n => n.type !== 'admin');
      
      // Sort by newest first
      filteredNotes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(filteredNotes);
    });
    return () => unsubscribe();
  }, [user, isAdmin]);

  const markAsRead = async (id) => {
    try { await deleteDoc(doc(db, "notifications", id)); } 
    catch (e) { console.error("Error clearing notification", e); }
  };

  // Admin Specific: Handle Return Logic inside Navbar
  const handleAcceptReturn = async (notification) => {
    if (!notification.fullOrderId || !notification.senderId) return;
    setProcessingId(notification.id);

    try {
      const orderRef = doc(db, "OrderItems", notification.fullOrderId);
      await updateDoc(orderRef, { orderStatus: "Returned", returnAcceptedAt: new Date() });

      // Notify User about the acceptance
      await addDoc(collection(db, "notifications"), {
        type: "user",
        recipientId: notification.senderId,
        subType: "order_update",
        message: `Your return request for Order #${notification.fullOrderId.slice(0,8)} has been ACCEPTED.`,
        createdAt: serverTimestamp(),
        read: false
      });

      // Delete the admin notification
      await deleteDoc(doc(db, "notifications", notification.id));
      
      if(onUpdateData) onUpdateData();

      toast.success("Return Accepted & User Notified", { theme: "dark", position: "top-center" });
    } catch (error) {
      console.error("Error accepting return:", error);
      toast.error("Failed to update order", { theme: "dark" });
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to render icon based on notification type
  const renderIcon = (note) => {
    if (isAdmin) return <AlertCircle size={16} className="text-amber-500"/>;
    if (note.subType === 'coupon') return <Ticket size={16} className="text-purple-400"/>;
    if (note.subType === 'order_update') return <Package size={16} className="text-blue-400"/>;
    return <Info size={16} className="text-slate-400"/>;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-300 hover:text-white transition-colors">
        <Bell size={22} />
        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-pulse"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
            <h4 className="font-bold text-white text-sm">{isAdmin ? 'Admin Notifications' : 'Your Notifications'}</h4>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-slate-500 hover:text-white"/></button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic">No new notifications</div>
            ) : (
              notifications.map(note => (
                <div key={note.id} className="p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-3">
                     <div className="mt-1">
                        {renderIcon(note)}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm text-slate-300 leading-snug">{note.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'Just now'}</p>
                     </div>
                     <button onClick={() => markAsRead(note.id)} className="text-slate-500 hover:text-rose-400"><X size={14}/></button>
                  </div>
                  
                  {/* Action Button for Admins (Return Requests) */}
                  {isAdmin && note.subType === 'return_request' && (
                     <button 
                       onClick={() => handleAcceptReturn(note)}
                       disabled={processingId === note.id}
                       className="w-full py-1.5 mt-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors flex justify-center items-center gap-2"
                     >
                       {processingId === note.id ? <Loader className="animate-spin" size={12}/> : "Accept Return Request"}
                     </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
//  MAIN COMPONENT: NAVBAR
// ==========================================
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const dropdownRef = useRef(null);
  const userIconRef = useRef(null);
  
  const cart = useSelector(state => state.cart); 
  const totalQuantity = useSelector(state => state.cart.totalQuantity);

  // --- AUTH & CART LOADING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuth(!!user);

      if (user) {
        localStorage.setItem("isAuthenticated", "true");
        
        // Check Admin Role
        const checkAdmin = user.email === "harigudipati666@gmail.com";
        setIsAdmin(checkAdmin);

        // Load Cart
        const savedCart = localStorage.getItem(`cart_${user.uid}`);
        if (savedCart) {
          dispatch(setCart(JSON.parse(savedCart)));
        } else {
          dispatch(clearCart()); 
        }

        // Fetch Profile Image
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setProfileImage(docSnap.data().profileImage);
        } catch (error) { console.error(error); }

      } else {
        localStorage.removeItem("isAuthenticated");
        setProfileImage(null);
        setIsAdmin(false);
        dispatch(clearCart());
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  // --- SAVE CART ---
  useEffect(() => {
    if (currentUser?.uid) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  // --- CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown) {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          userIconRef.current &&
          !userIconRef.current.contains(event.target)
        ) {
          setShowDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [showDropdown]);

  useEffect(() => {
    setIsOpen(false);
    setShowDropdown(false);
  }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("isAuthenticated");
    dispatch(clearCart()); 
    // Toast Notification
    toast.success("Logout Successfully", { theme: "dark", position: "top-center" });
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const getDesktopClass = (path) => location.pathname === path ? "text-blue-500 font-bold transition-colors" : "text-slate-300 hover:text-white transition-colors";
  const getMobileClass = (path) => location.pathname === path ? "block px-3 py-2 rounded-md text-base font-medium text-white bg-slate-700" : "block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700";

  return (
    <>
    <ToastContainer />
    <nav className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                GSH<span className="text-blue-500">.</span>STORE
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1">Premium Collection</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="w-full relative flex items-center">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-full pl-5 pr-12 py-2.5 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors">
                <FaSearch size={14} />
              </button>
            </form>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-8 text-sm font-medium">
            <Link to="/" className={getDesktopClass("/")}>Home</Link>
            <Link to="/about" className={getDesktopClass("/about")}>About</Link>
            <Link to="/contact" className={getDesktopClass("/contact")}>Contact</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
              <FaSearch size={20} />
            </button>

            {/* Notification Bell (Only if Auth) */}
            {isAuth && currentUser && (
              <NavbarNotifications user={currentUser} isAdmin={isAdmin} />
            )}

            <Link to="/cart" className="relative group text-slate-300 hover:text-white transition-colors">
              <FaShoppingCart size={22} />
              {totalQuantity > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {isAuth ? (
              <div className="relative hidden md:block">
                <button ref={userIconRef} onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 focus:outline-none">
                  <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-600 hover:border-blue-500 transition-all">
                    {profileImage ? <img src={profileImage} alt="User" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400"><FaUser size={14} /></div>}
                  </div>
                </button>

                {showDropdown && (
                  <div ref={dropdownRef} className="absolute right-0 mt-3 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-sm animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-slate-700">
                       <p className="text-slate-400 text-xs">Signed in as</p>
                       <p className="text-white font-medium truncate">{currentUser?.email}</p>
                    </div>
                    <Link to={isAdmin ? "/admindashboard" : "/userdashboard"} className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white">Dashboard</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700 hover:text-red-300">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate("/login")} className="hidden md:block text-slate-300 hover:text-white transition-colors">
                 <FaUser size={22} />
              </button>
            )}

            <button className="md:hidden text-slate-300" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <form onSubmit={handleSearch} className="flex items-center">
               <input type="text" placeholder="Search..." className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm border border-slate-700 outline-none focus:border-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </form>
            <div className="flex flex-col space-y-1">
              <Link to="/" className={getMobileClass("/")}>Home</Link>
              <Link to="/about" className={getMobileClass("/about")}>About</Link>
              <Link to="/contact" className={getMobileClass("/contact")}>Contact</Link>
            </div>
            <div className="border-t border-slate-700 pt-4">
              {isAuth ? (
                <div className="flex items-center gap-3 px-3">
                  <div className="h-10 w-10 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
                    {profileImage ? <img src={profileImage} alt="profile" className="w-full h-full object-cover"/> : <FaUser className="text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-white truncate">{currentUser?.email}</div>
                    <Link to={isAdmin ? "/admindashboard" : "/userdashboard"} className="text-sm text-blue-400 hover:text-blue-300 block">View Dashboard</Link>
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
    </>
  );
};

export default Navbar;
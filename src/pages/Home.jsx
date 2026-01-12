import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItem } from '../slices/cartSlice';
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore"; 
import { 
  FaShoppingCart, FaBolt, FaTruck, FaShieldAlt, FaUndo, 
  FaStar, FaArrowRight, FaQuoteLeft, FaCheck, FaClock, FaFire 
} from "react-icons/fa";
import { products } from "../data/dataUtils";

// --- REUSABLE PRODUCT CARD COMPONENT ---
const ProductCard = ({ product, isAdmin, onAddToCart, onBuyNow }) => {
  
  const getProductImage = (p) => {
    if (p.image_url) return p.image_url;
    if (p.product_category === "Accessories") return "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2070&auto=format&fit=crop";
    else if (p.product_department === "Men") return "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2148&auto=format&fit=crop";
    else if (p.product_department === "Women") return "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=2135&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop";
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        size={10} 
        className={`${i < Math.round(rating) ? "text-yellow-400" : "text-slate-600"}`} 
      />
    ));
  };

  return (
    <div className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:scale-105 flex flex-col h-full">
      
      <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-700">
        <img 
          src={getProductImage(product)} 
          alt={product.product_name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"; }} 
        />
        
        {/* Rating Badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 z-10 shadow-lg">
          <div className="flex gap-0.5">{renderStars(product.product_rating || 0)}</div>
          <span className="text-[9px] font-bold text-slate-200 mt-0.5">({product.product_rating || 0})</span>
        </div>

        {/* Overlay Button */}
        {!isAdmin && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end justify-center pb-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button onClick={() => onBuyNow(product)} className="flex items-center gap-1 bg-white text-slate-900 px-4 py-1.5 rounded-full font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors shadow-lg transform active:scale-95">
              <FaBolt size={12}/> Buy Now
            </button>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{product.product_department}</span>
        <h3 className="text-sm sm:text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">{product.product_name}</h3>
        
        <div className="mt-auto flex justify-between items-center border-t border-slate-700 pt-3">
          <span className="text-base sm:text-lg font-bold text-slate-100">₹{product.selling_unit_price.toFixed(2)}</span>
          
          {!isAdmin && (
            <button onClick={() => onAddToCart(product)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 active:scale-90">
              <FaShoppingCart size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // --- COUPON STATES ---
  const [isOfferClaimed, setIsOfferClaimed] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const categories = ["All", "Men", "Women", "Accessories"];

  // Check Admin
  useEffect(() => {
    const checkAdmin = () => {
      if (auth.currentUser && auth.currentUser.email === "harigudipati666@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
    const timer = setTimeout(checkAdmin, 1000); 
    return () => clearTimeout(timer);
  }, []);

  // --- FETCH ACTIVE COUPON ---
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const q = query(collection(db, "coupons"), where("isActive", "==", true));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const allCoupons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          allCoupons.sort((a, b) => {
             const timeA = a.createdAt?.seconds || 0;
             const timeB = b.createdAt?.seconds || 0;
             return timeB - timeA;
          });

          const latestCoupon = allCoupons[0];
          const expiry = latestCoupon.expiryDate?.toDate 
            ? latestCoupon.expiryDate.toDate() 
            : new Date(latestCoupon.expiryDate);
          
          if (expiry > new Date()) {
             setActiveCoupon({ 
               code: latestCoupon.code, 
               discount: latestCoupon.discount, 
               expiry 
             });
             const diff = Math.floor((expiry - new Date()) / 1000);
             setTimeLeft(diff > 0 ? diff : 0);
          } else {
             console.log("Latest coupon is expired");
          }
        }
      } catch (e) {
        console.error("Error fetching coupon:", e);
      }
    };
    fetchCoupon();
  }, []);

  // --- COUNTDOWN TIMER ---
  useEffect(() => {
    if (!activeCoupon) return;
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeCoupon]);

  const formatTime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredProducts = selectedCategory === "All"
      ? products.slice(0, 8)
      : products.filter((p) => p.product_department === selectedCategory || p.product_category === selectedCategory).slice(0, 8);

  const trendingProducts = products.slice(8, 16);

  const handleAddToCart = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        quantity: 1,
    }));
    toast.success("Added to cart");
  };

  const handleBuyNow = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        quantity: 1,
    }));
    navigate("/cart");
  };

  const handleClaimOffer = () => {
    if (activeCoupon && !isOfferClaimed) {
        setIsOfferClaimed(true);
        navigator.clipboard.writeText(activeCoupon.code);
        toast.success(`Offer Claimed! Code ${activeCoupon.code} copied to clipboard.`, {
            position: "bottom-center",
            theme: "dark",
        });
    } else if (isOfferClaimed) {
        toast.info("You have already claimed this offer.", { theme: "dark", position: "bottom-center" });
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative h-[80vh] md:h-[90vh] flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop")' }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        <div className="relative z-20 max-w-4xl animate-fade-in-up px-4">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs md:text-sm font-bold tracking-wider uppercase mb-6 backdrop-blur-md">New Season Arrival</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6">Redefine your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-500">digital style.</span></h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed">Premium dark aesthetics for the modern minimalist. Curated fashion for those who dare to stand out in a crowded world.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })} className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] hover:-translate-y-1">
              Explore Collection <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* FLOATING TRUST BAR */}
      <section className="relative z-30 px-4 -mt-16 md:-mt-24 mb-16 md:mb-24">
        <div className="max-w-6xl mx-auto bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[ { icon: FaTruck, title: "Free Shipping", desc: "On orders over ₹999" }, { icon: FaShieldAlt, title: "Secure Payment", desc: "100% protected" }, { icon: FaUndo, title: "Easy Returns", desc: "30-day money back" }, { icon: FaStar, title: "Top Rated", desc: "4.9/5 from users" }, ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center p-2 md:px-4">
                <item.icon className="text-blue-500 text-2xl md:text-3xl mb-3" />
                <h4 className="text-white font-bold text-sm md:text-base">{item.title}</h4>
                <p className="text-slate-400 text-xs md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER - Updated for horizontal scroll on mobile */}
      <section id="shop" className="px-4 mb-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Shop by Category</h2>
        
        {/* Changed: Used flex-nowrap and overflow-x-auto for horizontal scroll */}
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-4 justify-start md:justify-center scrollbar-hide px-4">
          <div className="flex gap-2 bg-slate-800 p-2 rounded-2xl md:rounded-full border border-slate-700 min-w-max mx-auto">
            {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-6 py-2.5 rounded-xl md:rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${selectedCategory === cat ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                >
                {cat}
                </button>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map((p) => (
            <ProductCard 
              key={p.product_id} 
              product={p} 
              isAdmin={isAdmin} 
              onAddToCart={handleAddToCart} 
              onBuyNow={handleBuyNow} 
            />
          ))}
        </div>
      </section>

      {/* --- PROMO SECTION --- */}
      {activeCoupon && timeLeft > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-24 animate-fade-in-up"> 
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 border border-slate-700 p-8 md:p-16 text-center shadow-2xl"> 
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div> 
            <div className="relative z-10"> 
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"> Flat {activeCoupon.discount}% OFF </h2> 
              
              <div className="flex items-center justify-center gap-2 text-blue-200 mb-6 font-mono text-lg bg-black/30 w-fit mx-auto px-4 py-1.5 rounded-full border border-blue-500/30">
                <FaClock className="text-blue-400 animate-pulse" />
                <span>Expires in: <span className="text-white font-bold">{formatTime(timeLeft)}</span></span>
              </div>

              <p className="text-slate-300 text-base md:text-lg mb-8 max-w-xl mx-auto"> Upgrade your wardrobe today. Use code <strong className="text-white bg-slate-700/50 border border-slate-600 px-2 py-1 rounded mx-1">{activeCoupon.code}</strong> at checkout for exclusive savings. </p> 
              
              <button 
                onClick={handleClaimOffer} 
                disabled={isOfferClaimed}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 mx-auto ${isOfferClaimed ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25'}`}
              > 
                  {isOfferClaimed ? <><FaCheck /> Code Copied!</> : 'Claim Offer'} 
              </button> 
            </div> 
          </div> 
        </section> 
      )}
       
      {/* TRENDING NOW SECTION */}
      <section className="max-w-7xl mx-auto px-4 pb-24 border-t border-slate-800 pt-16">
         <div className="flex items-center gap-3 mb-8 justify-center">
            <FaFire className="text-orange-500 text-2xl"/>
            <h2 className="text-3xl font-bold text-white">Trending Now</h2>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {trendingProducts.map((p) => (
               <ProductCard 
                 key={p.product_id} 
                 product={p} 
                 isAdmin={isAdmin} 
                 onAddToCart={handleAddToCart} 
                 onBuyNow={handleBuyNow} 
               />
            ))}
         </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 mb-24"> <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What They Say</h2> <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {[1, 2, 3].map((i) => ( <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 relative"> <FaQuoteLeft className="text-blue-500/20 text-4xl absolute top-6 left-6" /> <p className="text-slate-300 relative z-10 mb-6 mt-4"> "Absolutely love the quality. The dark aesthetic fits perfectly with my setup. Shipping was incredibly fast too!" </p> <div className="flex items-center gap-4"> <div className="w-10 h-10 bg-slate-600 rounded-full overflow-hidden"> <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" /> </div> <div> <h5 className="font-bold text-white text-sm">Alex Johnson</h5> <div className="flex text-yellow-500 text-xs"> <FaStar /><FaStar /><FaStar /><FaStar /><FaStar /> </div> </div> </div> </div> ))} </div> </section> 
       
      {/* BRAND LOGOS */}
      <section className="py-10 border-t border-slate-800"> <p className="text-center text-slate-500 text-sm tracking-[0.2em] font-bold mb-8 uppercase">Trusted By</p> <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"> <img src="https://images-platform.99static.com//c60-ZrzNS_3CeTpUcVrHuXehJzo=/27x0:1034x1007/fit-in/500x500/99designs-contests-attachments/63/63177/attachment_63177734" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" /> <img src="https://img.freepik.com/free-vector/ecological-market-logo-design_23-2148468229.jpg" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" /> <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRekbNCEfc1AZgGsQy6kjmeYR-HcwL5iqjzjg&s" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" /> <img src="https://cdn.dribbble.com/userupload/14791292/file/original-1ea2239ba9216548bf9d4a6006811db1.png?format=webp&resize=400x300&vertical=center" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" /> </div> </section>
    </main>
  );
};

export default Home;
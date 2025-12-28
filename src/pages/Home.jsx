import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItem } from "../slices/cartSlice";
import { toast } from "react-toastify";
import {
  FaShoppingCart,
  FaBolt,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaStar,
  FaArrowRight
} from "react-icons/fa";
import { products } from "../data/dataUtils";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Men", "Women", "Accessories"];

  // Filtering Logic
  const filteredProducts =
    selectedCategory === "All"
      ? products.slice(0, 8)
      : products
          .filter(
            (p) =>
              p.product_department === selectedCategory ||
              p.product_category === selectedCategory
          )
          .slice(0, 8);

  const handleAddToCart = (product) => {
    dispatch(
      addItem({
        id: product.product_id,
        name: product.product_name,
        price: product.selling_unit_price,
        image: product.image_url,
        quantity: 1,
      })
    );
    toast.success("Added to cart");
  };

  const handleBuyNow = (product) => {
    dispatch(
      addItem({
        id: product.product_id,
        name: product.product_name,
        price: product.selling_unit_price,
        image: product.image_url,
        quantity: 1,
      })
    );
    navigate("/cart");
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] flex items-center justify-center text-center px-4 overflow-hidden">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop")' }}
        ></div>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/30"></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-3xl animate-fade-in-up">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
            New Season Arrival
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Redefine your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-500">
              digital style.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto font-light">
            Premium dark aesthetics for the modern minimalist. curated for those who dare to stand out.
          </p>
          <button 
            onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] hover:-translate-y-1"
          >
            Explore Collection 
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* --- FLOATING TRUST BAR --- */}
      <section className="relative z-30 px-4 -mt-20 mb-20">
        <div className="max-w-6xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-wrap justify-center md:justify-between gap-6 md:gap-0">
          {[
            { icon: FaTruck, text: "Free Shipping" },
            { icon: FaShieldAlt, text: "Secure Payment" },
            { icon: FaUndo, text: "30-Day Returns" },
            { icon: FaStar, text: "4.9/5 Ratings" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-slate-200 font-medium">
              <item.icon className="text-blue-500 text-xl md:text-2xl" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- CATEGORY FILTER --- */}
      <section id="shop" className="px-4 py-12 text-center">
        <div className="inline-flex flex-wrap justify-center gap-2 bg-slate-800 p-2 rounded-full border border-slate-700">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- PRODUCT GRID --- */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((p) => (
            <div 
              key={p.product_id} 
              className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-2"
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden bg-slate-700">
                <img 
                  src={p.image_url} 
                  alt={p.product_name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay Buy Button */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end justify-center pb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <button 
                    onClick={() => handleBuyNow(p)}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-500 hover:text-white transition-colors shadow-lg"
                  >
                    <FaBolt /> Buy Now
                  </button>
                </div>
              </div>

              {/* Card Info */}
              <div className="p-5">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {p.product_department}
                </span>
                <h3 className="text-lg font-semibold text-white mt-1 mb-2 truncate group-hover:text-blue-400 transition-colors">
                  {p.product_name}
                </h3>
                
                <div className="flex justify-between items-center mt-4 border-t border-slate-700 pt-4">
                  <span className="text-xl font-bold text-slate-100">
                    ₹{p.selling_unit_price.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => handleAddToCart(p)}
                    className="w-10 h-10 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300"
                  >
                    <FaShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROMO BANNER --- */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-10 md:p-16 text-center shadow-2xl">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">
              Flat 20% OFF
            </h2>
            <p className="text-slate-300 text-lg mb-8">
              Use code <strong className="text-white bg-slate-700 px-2 py-1 rounded">GSH20</strong> at checkout for exclusive savings.
            </p>
            <button className="px-8 py-3 rounded-full border-2 border-blue-500 text-blue-400 font-bold hover:bg-blue-600 hover:text-white transition-all duration-300">
              Copy Code
            </button>
          </div>
        </div>
      </section>

      {/* --- BRANDS --- */}
      <section className="py-10 border-t border-slate-800">
        <p className="text-center text-slate-500 text-sm tracking-[0.2em] font-bold mb-8 uppercase">Trusted By</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
           <img src="https://images-platform.99static.com//c60-ZrzNS_3CeTpUcVrHuXehJzo=/27x0:1034x1007/fit-in/500x500/99designs-contests-attachments/63/63177/attachment_63177734" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" />
           <img src="https://img.freepik.com/free-vector/ecological-market-logo-design_23-2148468229.jpg" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" />
           <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRekbNCEfc1AZgGsQy6kjmeYR-HcwL5iqjzjg&s" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" />
           <img src="https://cdn.dribbble.com/userupload/14791292/file/original-1ea2239ba9216548bf9d4a6006811db1.png?format=webp&resize=400x300&vertical=center" alt="Brand" className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1" />
        </div>
      </section>

    </main>
  );
};

export default Home;
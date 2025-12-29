import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaShoppingCart, FaBolt } from "react-icons/fa";

import { addItem } from "../slices/cartSlice";
import products from "../data/product.js";

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const [filteredProducts, setFilteredProducts] = useState([]);

  // --- HELPER: Get Image or Fallback (Same as Home.jsx) ---
  const getProductImage = (product) => {
    if (product.image_url) return product.image_url;
    
    if (product.product_category === "Accessories") {
        return "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2070&auto=format&fit=crop";
    } else if (product.product_department === "Men") {
        return "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2148&auto=format&fit=crop";
    } else if (product.product_department === "Women") {
        return "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=2135&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop";
  };

  // 🔍 Filter products based on search query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      return;
    }

    const result = products.filter((product) =>
      [
        product.product_name,
        product.product_brand,
        product.product_category,
      ].some((field) =>
        field?.toLowerCase().includes(query.toLowerCase())
      )
    );

    setFilteredProducts(result.slice(0, 20));
  }, [query]);

  // 🛒 Add to Cart
  const handleAddToCart = (product) => {
    dispatch(
      addItem({
        product_id: product.product_id, // Matches slice
        product_name: product.product_name, // Matches slice
        selling_unit_price: product.selling_unit_price, // Matches slice
        image_url: getProductImage(product), // Matches slice
        quantity: 1,
      })
    );
    toast.success("Added to cart");
  };

  // ⚡ Buy Now
  const handleBuyNow = (product) => {
    dispatch(
      addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: getProductImage(product),
        quantity: 1,
      })
    );
    navigate("/cart");
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-12">
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">
          Search Results for <span className="text-blue-500">"{query}"</span>
        </h2>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((p) => (
              <div
                key={p.product_id}
                className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-2 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-700">
                  <img
                    src={getProductImage(p)}
                    alt={p.product_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"; }}
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
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                    {p.product_department}
                  </span>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {p.product_name}
                  </h3>

                  <div className="mt-auto flex justify-between items-center border-t border-slate-700 pt-4">
                    <span className="text-xl font-bold text-slate-100">
                      ₹{p.selling_unit_price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="w-10 h-10 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 active:scale-90"
                    >
                      <FaShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-3xl border border-slate-700/50">
            <div className="bg-slate-700 p-6 rounded-full mb-4 opacity-50">
               <FaShoppingCart className="text-4xl text-slate-400" />
            </div>
            <p className="text-xl text-slate-400 font-medium">
              No products found for "{query}"
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Try checking your spelling or use different keywords.
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold transition-colors"
            >
              Browse All Products
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Search;
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { addItem } from "../slices/cartSlice";
import products from "../data/product.js";

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const [filteredProducts, setFilteredProducts] = useState([]);

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
        id: product.product_id,
        name: product.product_name,
        price: product.selling_unit_price,
        image: product.image_url,
        quantity: 1,
      })
    );

    toast.success("Product added to cart");
  };

  // ⚡ Buy Now
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
    <main className="min-h-screen bg-slate-900 text-white font-sans pb-12">
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">
          Search Results for <span className="text-blue-500">"{query}"</span>
        </h2>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div
                className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20"
                key={product.product_id}
              >
                {/* Image Box */}
                <div className="h-56 w-full overflow-hidden bg-white/5 relative">
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-grow gap-2">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                    {product.product_department}
                  </span>

                  <h4 className="text-lg font-semibold text-white leading-tight line-clamp-2">
                    {product.product_name}
                  </h4>

                  <p className="text-xl font-bold text-blue-500 mt-1">
                    ₹{product.selling_unit_price.toFixed(2)}
                  </p>

                  {/* Actions */}
                  <div className="mt-auto pt-4 flex gap-3">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 py-2 px-3 rounded-lg border border-white/20 text-white font-semibold text-sm transition-all hover:bg-white/10 active:scale-95"
                    >
                      Add to Cart
                    </button>

                    <button
                      onClick={() => handleBuyNow(product)}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xl text-zinc-400">
              No products found for "{query}"
            </p>
            <p className="text-sm text-zinc-500 mt-2">Try checking your spelling or use different keywords.</p>
          </div>
        )}
      </section>
    </main>
  );
};
7
export default Search;
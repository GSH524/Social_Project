import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { addItem } from "../slices/cartSlice";
import products from "../data/product.js";

import "./Search.css";

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

  // 🛒 Add to Cart (NO LOGIN CHECK)
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

  // ⚡ Buy Now (NO LOGIN CHECK)
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
    <main className="home-dark">
      <section className="products" style={{ padding: "3rem 2rem" }}>
        <h2 className="section-title">
          Search Results for "{query}"
        </h2>

        {filteredProducts.length > 0 ? (
          <div className="grid">
            {filteredProducts.map((product) => (
              <div className="card" key={product.product_id}>
                <div className="img-box">
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                  />
                </div>

                <div className="card-body">
                  <span className="tag">
                    {product.product_department}
                  </span>

                  <h4>{product.product_name}</h4>

                  <p className="price">
                    ₹{product.selling_unit_price.toFixed(2)}
                  </p>

                  <div className="actions">
                    <button onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>

                    <button
                      className="buy"
                      onClick={() => handleBuyNow(product)}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">
            No products found for "{query}"
          </p>
        )}
      </section>
    </main>
  );
};

export default Search;

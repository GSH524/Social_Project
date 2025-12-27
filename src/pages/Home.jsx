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
import "./Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Men", "Women", "Accessories"];

  const filteredProducts =
    selectedCategory === "All"
      ? products.slice(0, 8) // Limit to 8 for cleaner grid
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
    <main className="home-container">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-tag">New Season Arrival</span>
          <h1>redefine your <br /> <span className="text-gradient">digital style.</span></h1>
          <p>Premium dark aesthetics for the modern minimalist.</p>
          <button className="btn-primary" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>
            Explore Collection <FaArrowRight />
          </button>
        </div>
      </section>

      {/* FLOATING TRUST BAR */}
      <section className="trust-wrapper">
        <div className="trust-bar">
          <div className="trust-item"><FaTruck className="icon" /> <span>Free Shipping</span></div>
          <div className="trust-item"><FaShieldAlt className="icon" /> <span>Secure Payment</span></div>
          <div className="trust-item"><FaUndo className="icon" /> <span>30-Day Returns</span></div>
          <div className="trust-item"><FaStar className="icon" /> <span>4.9/5 Ratings</span></div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section id="shop" className="categories-section">
        <div className="tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="products-section">
        <div className="grid">
          {filteredProducts.map((p) => (
            <div className="product-card" key={p.product_id}>
              <div className="card-image">
                <img src={p.image_url} alt={p.product_name} />
                <div className="card-overlay">
                  <button className="btn-quick" onClick={() => handleBuyNow(p)}>
                    <FaBolt /> Buy Now
                  </button>
                </div>
              </div>
              <div className="card-info">
                <span className="category-tag">{p.product_department}</span>
                <h3>{p.product_name}</h3>
                <div className="price-row">
                  <span className="price">₹{p.selling_unit_price.toFixed(2)}</span>
                  <button className="btn-icon" onClick={() => handleAddToCart(p)}>
                    <FaShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="promo-banner">
        <div className="promo-content">
          <h2>Flat 20% OFF</h2>
          <p>Use code <strong>VAJRA20</strong> at checkout.</p>
          <button className="btn-outline">Copy Code</button>
        </div>
      </section>

      {/* BRANDS */}
      <section className="brands-section">
        <p className="brands-title">TRUSTED BY</p>
        <div className="brands-grid">
           <img src="https://images-platform.99static.com//c60-ZrzNS_3CeTpUcVrHuXehJzo=/27x0:1034x1007/fit-in/500x500/99designs-contests-attachments/63/63177/attachment_63177734" alt="Brand" />
           <img src="https://img.freepik.com/free-vector/ecological-market-logo-design_23-2148468229.jpg" alt="Brand" />
           <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRekbNCEfc1AZgGsQy6kjmeYR-HcwL5iqjzjg&s" alt="Brand" />
           <img src="https://cdn.dribbble.com/userupload/14791292/file/original-1ea2239ba9216548bf9d4a6006811db1.png?format=webp&resize=400x300&vertical=center" alt="Brand" />
        </div>
      </section>
    </main>
  );
};

export default Home;
import React from "react";
import { FaBullseye, FaEye, FaHandshake, FaGem, FaTruck, FaUsers, FaCheckCircle, FaLightbulb } from "react-icons/fa";
import "./About.css";

const About = () => {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="hero-overlay"></div>
        <div className="about-hero-content">
          <h1>Redefining Retail</h1>
          <p>Experience the future of shopping with Vajra Retails.</p>
        </div>
      </section>

      {/* Company Overview (Glass Cards) */}
      <section className="about-section container">
        <div className="about-grid">
          
          <div className="glass-card fade-up">
            <div className="icon-box"><FaUsers /></div>
            <h2>Who We Are</h2>
            <p>
              Vajra Retails is a customer-centric e-commerce platform designed to
              make online shopping simple, affordable, and reliable. We bridge the gap 
              between premium quality and affordable pricing.
            </p>
          </div>

          <div className="glass-card fade-up delay-1">
            <div className="icon-box"><FaBullseye /></div>
            <h2>Our Mission</h2>
            <p>
              To empower customers with a seamless shopping experience, 
              transparent pricing, secure payments, and lightning-fast delivery—all 
              through an intuitive digital platform.
            </p>
          </div>

          <div className="glass-card fade-up delay-2">
            <div className="icon-box"><FaEye /></div>
            <h2>Our Vision</h2>
            <p>
              To become the most trusted retail brand by continuously innovating 
              technology, expanding product categories, and building lasting 
              relationships with our community.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="values-section">
        <div className="section-header">
          <h2>Our Core Values</h2>
          <div className="underline"></div>
        </div>

        <div className="values-grid container">
          <div className="value-card">
            <FaHandshake className="value-icon" />
            <h4>Customer First</h4>
            <p>Every decision we make is focused on your satisfaction and trust.</p>
          </div>

          <div className="value-card">
            <FaGem className="value-icon" />
            <h4>Quality Assurance</h4>
            <p>We strictly ensure all products meet global quality standards.</p>
          </div>

          <div className="value-card">
            <FaCheckCircle className="value-icon" />
            <h4>Transparency</h4>
            <p>Clear pricing, honest policies, and zero hidden costs.</p>
          </div>

          <div className="value-card">
            <FaLightbulb className="value-icon" />
            <h4>Innovation</h4>
            <p>Continuously improving our platform with cutting-edge tech.</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="choose-us container">
        <div className="glass-panel">
          <div className="choose-content">
            <h2>Why Choose Vajra?</h2>
            <p>We don't just sell products; we deliver experiences.</p>
            <ul className="feature-list">
              <li><FaCheckCircle className="check-icon"/> Secure and simple checkout process</li>
              <li><FaCheckCircle className="check-icon"/> 7-Day Easy returns and refunds</li>
              <li><FaCheckCircle className="check-icon"/> Curated range of premium products</li>
              <li><FaCheckCircle className="check-icon"/> 24/7 Dedicated customer support</li>
            </ul>
          </div>
          <div className="choose-image">
             <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Team" />
          </div>
        </div>
      </section>

    </main>
  );
};

export default About;
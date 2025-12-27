import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPaperPlane } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* 1. Brand & Socials */}
        <div className="footer-col brand-col">
          {/* Use your actual image path or a text fallback if image is missing */}
          <div className="footer-logo">
            <h2>Vajra Retails</h2>
          </div>
          <p className="footer-desc">
            Your trusted destination for premium quality products.
            Smart Shopping, Better Living.
          </p>

          <div className="social-links">
            <Link to="https://www.facebook.com/" className="social-icon"><FaFacebookF /></Link>
            <Link to="https://x.com/" className="social-icon"><FaTwitter /></Link>
            <Link to="https://gsh-personal.vercel.app/" className="social-icon"><FaInstagram /></Link>
            <Link to="https://www.linkedin.com/in/srihari-gudipati-0410a925a/" className="social-icon"><FaLinkedinIn /></Link>
          </div>
        </div>

        {/* 2. Quick Links */}
        <div className="footer-col links-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* 3. Support */}
        <div className="footer-col links-col">
          <h4>Contact Support</h4>
          <ul>
            <li>
              <a href="tel:+919347659937" className="contact-link">
                +91-9347659937
              </a>
            </li>
            <li>
              <a href="mailto:gudipatisrihari7@gmail.com" className="contact-link">
                gudipatisrihari7@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* 4. Newsletter */}
        <div className="footer-col newsletter-col">
          <h4>Stay Updated</h4>
          <p>Subscribe to get the latest products and best deals.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit"><FaPaperPlane /></button>
          </form>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© 2025 Vajra Retails. All rights reserved.</p>
          <div className="payment-methods">
            <span>Visa</span>
            <span>MasterCard</span>
            <span>PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
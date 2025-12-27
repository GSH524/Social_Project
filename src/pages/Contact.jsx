import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
import "./Contact.css";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    subject: "",
    category: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, contact, subject, category, message } = form;

    if (!name || !contact || !subject || !category || !message) {
      setStatus("⚠️ Please fill in all fields.");
      return;
    }

    setStatus("Sending...");

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: name,
          contact_info: contact,
          subject,
          category,
          message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setStatus("✅ Message sent successfully!");
      setForm({
        name: "",
        contact: "",
        subject: "",
        category: "",
        message: "",
      });
    } catch (error) {
      setStatus("❌ Failed to send. Please try again later.");
    }
  };

  return (
    <section className="contact-page">
      <div className="contact-overlay"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="contact-container glass-panel"
      >

        {/* LEFT INFO SECTION */}
        <div className="contact-info">
          <div className="info-header">
            <h2>Let's Connect</h2>
            <div className="underline"></div>
          </div>
          
          <p className="contact-desc">
            Have questions about your order, payments, or just want to say hello? 
            Our support team is ready to assist you.
          </p>

          <div className="contact-details">
            {/* EMAIL CARD */}
            <div className="contact-card">
              <div className="icon-box"><Mail size={22} /></div>
              <div className="contact-card-content">
                <h4>Email Us</h4>
                <p>easystore@vajra.com</p>
              </div>
            </div>
            
            {/* PHONE CARD */}
            <div className="contact-card">
              <div className="icon-box"><Phone size={22} /></div>
              <div className="contact-card-content">
                <h4>Call Us</h4>
                <p>+91 6303125585</p>
              </div>
            </div>
            
            {/* LOCATION CARD */}
            <div className="contact-card">
              <div className="icon-box"><MapPin size={22} /></div>
              <div className="contact-card-content">
                <h4>Visit Us</h4>
                <p>Hyderabad, Telangana, India</p>
              </div>
            </div>
          </div>

          <div className="map-wrapper">
            <iframe
              title="Store Location"
              className="contact-map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.887228399564!2d78.47444007516634!3d17.43687298345903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb90c8c4391677%3A0x6b77227d894e6361!2sHyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1709664567890!5m2!1sen!2sin"
              loading="lazy"
              allowFullScreen=""
            />
          </div>
        </div>

        {/* RIGHT FORM SECTION */}
        <motion.div 
          className="form-wrapper"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="contact-form">
            <h3>Send a Message</h3>
            
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                className="glass-input"
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="contact"
                placeholder="Email or Phone Number"
                value={form.contact}
                onChange={handleChange}
                className="glass-input"
              />
            </div>

            <div className="form-group">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="glass-input"
              >
                <option value="" disabled>Select Support Type</option>
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Problem">Payment Problem</option>
                <option value="Delivery Delay">Delivery Delay</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
            
            <div className="form-group">
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                className="glass-input"
              />
            </div>

            <div className="form-group">
              <textarea
                name="message"
                rows="4"
                placeholder="How can we help you?"
                value={form.message}
                onChange={handleChange}
                className="glass-input"
              />
            </div>

            <button type="submit" className="submit-btn">
              <span>Send Message</span> <Send size={18} />
            </button>

            {status && <div className={`status-msg ${status.includes("✅") ? "success" : "error"}`}>{status}</div>}
          </form>
        </motion.div>
      </motion.div>

      {/* FLOATING CHAT BUTTON */}
      <a
        href="https://wa.me/916303125585"
        target="_blank"
        rel="noreferrer"
        className="chat-float"
        title="Chat with us"
      >
        <MessageCircle size={28} />
      </a>
    </section>
  );
}
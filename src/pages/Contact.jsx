import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
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
      setForm({ name: "", contact: "", subject: "", category: "", message: "" });
    } catch (error) {
      setStatus("❌ Failed to send. Please try again later.");
    }
  };

  return (
    <section className="min-h-screen bg-slate-950 relative flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* --- Ambient Background Glows --- */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* --- Main Glass Container --- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >

        {/* --- LEFT: INFO SECTION --- */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-slate-900/40 relative border-b lg:border-b-0 lg:border-r border-white/10">
          
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Let's Connect</h2>
            <div className="h-1.5 w-24 bg-blue-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Have questions about your order, payments, or just want to say hello? 
            Our support team is ready to assist you.
          </p>

          <div className="space-y-8 mb-10">
            {/* Contact Cards */}
            {[
              { icon: Mail, title: "Email Us", text: "easystore@vajra.com" },
              { icon: Phone, title: "Call Us", text: "+91 6303125585" },
              { icon: MapPin, title: "Visit Us", text: "Hyderabad, Telangana, India" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-5 group">
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-600/30">
                  <item.icon size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{item.title}</h4>
                  <p className="text-white text-lg font-medium">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dark Map */}
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
            <iframe
              title="Store Location"
              className="w-full h-full grayscale invert contrast-[0.9] opacity-80 hover:opacity-100 transition-opacity duration-500"
              src="https://maps.google.com/maps?q=Hyderabad,Telangana,India&t=&z=13&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              allowFullScreen=""
            />
          </div>
        </div>

        {/* --- RIGHT: FORM SECTION --- */}
        <motion.div 
          className="p-8 md:p-12 lg:p-16 bg-white/5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-3xl font-bold text-white mb-8">Send a Message</h3>
            
            <div className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <input
                type="text"
                name="contact"
                placeholder="Email or Phone Number"
                value={form.contact}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <div className="relative">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  style={{ color: form.category ? 'white' : '#64748b' }} // Placeholder color logic
                >
                  <option value="" disabled className="text-slate-500">Select Support Type</option>
                  <option value="Order Issue" className="bg-slate-800 text-white">Order Issue</option>
                  <option value="Payment Problem" className="bg-slate-800 text-white">Payment Problem</option>
                  <option value="Delivery Delay" className="bg-slate-800 text-white">Delivery Delay</option>
                  <option value="General Inquiry" className="bg-slate-800 text-white">General Inquiry</option>
                </select>
                {/* Custom arrow for select */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <textarea
                name="message"
                rows="4"
                placeholder="How can we help you?"
                value={form.message}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Send Message</span> <Send size={18} />
            </button>

            {/* Status Message */}
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-center font-medium border ${
                  status.includes("✅") 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {status}
              </motion.div>
            )}
          </form>
        </motion.div>
      </motion.div>

      {/* --- FLOATING CHAT BUTTON --- */}
      <a
        href="https://wa.me/916303125585"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-[#25D366]/40 hover:scale-110 hover:rotate-12 transition-all duration-300 z-50"
        title="Chat with us"
      >
        <MessageCircle size={32} />
      </a>
    </section>
  );
}
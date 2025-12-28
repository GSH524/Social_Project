import React from "react";
import { motion } from "framer-motion"; // Optional: for smooth animations
import { FaBullseye, FaEye, FaHandshake, FaGem, FaTruck, FaUsers, FaCheckCircle, FaLightbulb } from "react-icons/fa";

const About = () => {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20 selection:bg-blue-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80")' }}
        ></div>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900 z-10"></div>

        {/* Hero Content */}
        <div className="relative z-20 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
            Redefining Retail
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light tracking-wide">
            Experience the future of shopping with Vajra Retails.
          </p>
        </div>
      </section>

      {/* --- COMPANY OVERVIEW (Glass Cards) --- */}
      <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-30 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {[
            { 
              icon: <FaUsers />, 
              title: "Who We Are", 
              desc: "Vajra Retails is a customer-centric e-commerce platform designed to make online shopping simple, affordable, and reliable. We bridge the gap between premium quality and affordable pricing.",
              delay: "delay-0"
            },
            { 
              icon: <FaBullseye />, 
              title: "Our Mission", 
              desc: "To empower customers with a seamless shopping experience, transparent pricing, secure payments, and lightning-fast delivery—all through an intuitive digital platform.",
              delay: "delay-100"
            },
            { 
              icon: <FaEye />, 
              title: "Our Vision", 
              desc: "To become the most trusted retail brand by continuously innovating technology, expanding product categories, and building lasting relationships with our community.",
              delay: "delay-200"
            }
          ].map((card, i) => (
            <div 
              key={i} 
              className={`group bg-slate-800/70 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-3 hover:bg-slate-800/90 hover:border-blue-500/50 shadow-2xl animate-fade-in-up ${card.delay}`}
            >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110">
                {card.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{card.title}</h2>
              <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-200 transition-colors">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-20 text-center">
        <div className="mb-16">
          <h2 className="text-4xl font-extrabold text-white mb-4">Our Core Values</h2>
          <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <FaHandshake />, title: "Customer First", desc: "Every decision we make is focused on your satisfaction and trust.", color: "text-amber-500" },
            { icon: <FaGem />, title: "Quality Assurance", desc: "We strictly ensure all products meet global quality standards.", color: "text-amber-500" },
            { icon: <FaCheckCircle />, title: "Transparency", desc: "Clear pricing, honest policies, and zero hidden costs.", color: "text-amber-500" },
            { icon: <FaLightbulb />, title: "Innovation", desc: "Continuously improving our platform with cutting-edge tech.", color: "text-amber-500" }
          ].map((value, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-2">
              <div className={`text-5xl mb-6 flex justify-center ${value.color}`}>
                {value.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{value.title}</h4>
              <p className="text-slate-400 text-sm">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY CHOOSE US (Split Panel) --- */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <div className="flex flex-col lg:flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden items-center shadow-2xl">
          
          {/* Content */}
          <div className="flex-1 p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Choose Vajra?</h2>
            <p className="text-lg text-slate-400 mb-8 font-light">We don't just sell products; we deliver experiences.</p>
            
            <ul className="space-y-6">
              {[
                "Secure and simple checkout process",
                "7-Day Easy returns and refunds",
                "Curated range of premium products",
                "24/7 Dedicated customer support"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-200 text-lg">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-xl" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className="flex-1 w-full h-full min-h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1170&auto=format&fit=crop" 
              alt="Our Team" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

    </main>
  );
};

export default About;
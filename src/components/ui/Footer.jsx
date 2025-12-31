import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-20 pb-10 relative overflow-hidden">
      
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-10 lg:gap-12 text-center sm:text-left">

        {/* 1. Brand Section */}
        <div className="flex flex-col gap-5 items-center sm:items-start">
          <div className="flex flex-col mx-auto items-center sm:items-start">
            <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
              GSH<span className="text-blue-500">.</span>STORE
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1">
              Premium Collection
            </span>
          </div>
          <p className="text-sm max-w-xs sm:mx-0 leading-relaxed text-slate-400">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis sequi
            repudiandae in expedita reprehenderit natus molestias placeat.
          </p>

          <div className="flex gap-5 mx-auto mt-2 justify-center sm:justify-start">
            {[
              { icon: <FaFacebookF />, link: "https://www.facebook.com/" },
              { icon: <FaTwitter />, link: "https://x.com/" },
              { icon: <FaInstagram />, link: "https://gsh-personal.vercel.app/" },
              { icon: <FaLinkedinIn />, link: "https://www.linkedin.com/in/srihari-gudipati-0410a925a/" },
            ].map((s, i) => (
              <a
                key={i}
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center
                bg-white/5 border border-white/10 text-white
                hover:bg-blue-600 hover:border-blue-600 hover:-translate-y-1
                transition-all duration-300"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* 2. Company Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-white tracking-wide">Company</h4>
          <ul className="space-y-3 text-sm">
            {["Home", "Cart", "About", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="hover:text-blue-500 transition-colors duration-200 block sm:inline-block"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Support Info */}
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-white tracking-wide">Support</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="tel:+919347659937" className="hover:text-blue-500 transition-colors duration-200">
                +91-9347659937
              </a>
            </li>
            <li className="break-all">
              <a
                href="mailto:gudipatisrihari7@gmail.com"
                className="hover:text-blue-500 transition-colors duration-200"
              >
                gudipatisrihari7@gmail.com
              </a>
            </li>
            <li>Hyderabad, India</li>
          </ul>
        </div>

        {/* 4. Why Choose Us */}
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-white tracking-wide">Why GSH STORE?</h4>
          <ul className="space-y-3  mx-auto text-sm text-slate-400">
            <li className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-blue-500">✔</span> Premium quality products
            </li>
            <li className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-blue-500">✔</span> Secure & reliable shopping
            </li>
            <li className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-blue-500">✔</span> Affordable pricing
            </li>
            <li className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-blue-500">✔</span> Customer-first approach
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mt-16 pt-8 border-t border-white/5 text-center">
        <p className="text-xs sm:text-sm text-slate-500">
          © {new Date().getFullYear()} GSH STORE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
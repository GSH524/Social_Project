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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-600 to-pink-500" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-12">

        {/* Brand */}
        <div className="flex flex-col gap-4 items-center sm:items-start text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
              GSH<span className="text-blue-500">.</span>STORE
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1">
              Premium Collection
            </span>
          </div>
          <p className="text-sm max-w-xs">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis sequi
            repudiandae in expedita reprehenderit natus molestias placeat a nostrum quas,
            rem possimus! Earum dicta distinctio magnam et ullam optio? Animi?
          </p>

          <div className="flex gap-5">
            {[
              { icon: <FaFacebookF />, link: "https://www.facebook.com/" },
              { icon: <FaTwitter />, link: "https://x.com/" },
              { icon: <FaInstagram />, link: "https://gsh-personal.vercel.app/" },
              {
                icon: <FaLinkedinIn />,
                link: "https://www.linkedin.com/in/srihari-gudipati-0410a925a/",
              },
            ].map((s, i) => (
              <a
                key={i}
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center
                bg-white/5 border border-white/10 text-white
                hover:bg-blue-600 hover:border-blue-600 hover:-translate-y-1
                transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div className="text-center sm:text-left">
          <h4 className="footer-title text-white">Company</h4>
          <ul className="space-y-3">
            {["Home", "Cart", "About", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="hover:text-blue-600 transition"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="text-center sm:text-left">
          <h4 className="footer-title text-white">Contact Support</h4>
          <ul className="space-y-2">
            <li>
              <a href="tel:+919347659937" className="hover:text-blue-600 transition">
                +91-9347659937
              </a>
            </li>
            <li className="break-all">
              <a
                href="mailto:gudipatisrihari7@gmail.com"
                className="hover:text-blue-600 transition"
              >
                gudipatisrihari7@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Why Vajra Retails */}
        <div className="text-center sm:text-left">
          <h4 className="footer-title text-white">Why GSH STORE?</h4>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li>✔ Premium quality products</li>
            <li>✔ Secure & reliable shopping</li>
            <li>✔ Affordable pricing</li>
            <li>✔ Customer-first approach</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-white/5 pt-6">
        <p className="text-center text-sm text-slate-500">
          © 2025 Vajra Retails. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

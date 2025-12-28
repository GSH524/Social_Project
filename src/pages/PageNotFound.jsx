import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    // Background Container
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-black p-4 font-sans">
      
      {/* Glass Card */}
      <div className="relative w-full max-w-md p-10 text-center text-white bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        
        {/* Typography */}
        <h1 className="text-9xl font-extrabold tracking-widest text-white/20 select-none">
          404
        </h1>
        
        <div className="absolute top-24 left-0 right-0">
          <span className="bg-blue-600 text-white px-3 py-1 text-sm font-bold rounded uppercase tracking-widest shadow-lg">
            Page Not Found
          </span>
        </div>
        
        <h2 className="text-2xl font-bold mt-4 mb-2">Something's missing</h2>
        
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            Go Home
          </button>
          
          <button 
            onClick={() => navigate(-1)} 
            className="px-8 py-3 border border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default PageNotFound;
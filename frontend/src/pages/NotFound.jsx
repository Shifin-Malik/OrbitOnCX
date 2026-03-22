import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiHome, HiArrowLeft } from "react-icons/hi"; 

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 transition-colors duration-300">
      <div className="max-w-md w-full text-center">
       
        <div className="relative inline-block mb-8">
          <h1 className="text-[120px] font-black leading-none text-(--color-primary) opacity-10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl font-bold text-primary tracking-tight">
              Lost in Orbit?
            </h2>
          </div>
        </div>

        
        <div className="space-y-4">
          <p className="text-secondary text-lg leading-relaxed">
            Oops! The page you're looking for has drifted into a black hole.
          </p>
          <p className="text-muted text-sm uppercase tracking-widest font-medium">
            Error Code: orbital_drift_404
          </p>
        </div>

       
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all duration-300 shadow-(--color-accent-glow) active:scale-95"
          >
            <HiHome className="text-xl group-hover:-translate-y-0.5 transition-transform" />
            Back to Home
          </Link>

          <button
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 border-2 border-primary text-secondary hover:bg-background-elevated hover:border-(--color-primary) font-bold rounded-2xl transition-all duration-300 active:scale-95"
          >
            <HiArrowLeft className="text-xl" />
            Go Back
          </button>
        </div>

        
        <div className="mt-16 flex justify-center gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.2}s`, opacity: 0.4 + i * 0.2 }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotFound;

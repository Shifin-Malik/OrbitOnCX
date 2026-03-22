import React from "react";
import {
  FaCode,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaDiscord,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Platform",
      links: [
        { name: "Compiler", path: "/compiler" },
        { name: "Rooms", path: "/rooms" },
        { name: "Problems", path: "/leetcode" },
        { name: "Quiz", path: "/quiz" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", path: "#" },
        { name: "Community", path: "#" },
        { name: "API Reference", path: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "#" },
        { name: "Privacy Policy", path: "#" },
        { name: "Terms of Service", path: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--color-background)] border-t border-[var(--border-color-primary)] pt-20 pb-10 px-6 md:px-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
         
          <div className="lg:col-span-4 space-y-6">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="p-2.5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl shadow-lg shadow-indigo-500/10 group-hover:rotate-12 transition-transform duration-300">
                <FaCode className="text-white text-lg" />
              </div>
              <span className="text-2xl font-black text-[var(--text-color-primary)] tracking-tighter">
                Orbiton
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
                  CX
                </span>
              </span>
            </div>

            <p className="text-[var(--text-color-secondary)] text-sm leading-relaxed max-w-xs font-medium">
              Empowering developers to collaborate, learn, and build the future
              of software together in real-time.
            </p>

            
            <div className="flex gap-4">
              {[FaGithub, FaLinkedin, FaTwitter, FaDiscord].map(
                (Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="p-3 bg-[var(--color-background-soft)] rounded-2xl text-[var(--text-color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-300 border border-[var(--border-color-primary)]"
                  >
                    <Icon size={18} />
                  </a>
                ),
              )}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-6">
                  {section.title}
                </h4>
                <ul className="space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <button
                        onClick={() => navigate(link.path)}
                        className="text-sm font-bold text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors duration-300"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        
        <div className="pt-8 border-t border-[var(--border-color-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-[0.15em]">
            © {currentYear} OrbitonCX. Made with{" "}
            <span className="text-rose-500 animate-pulse">❤</span> for
            developers.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-full shadow-sm">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[9px] font-black text-[var(--text-color-secondary)] uppercase tracking-widest">
                Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

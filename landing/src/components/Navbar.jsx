import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-border-glow shadow-lg shadow-neon-blue/5'
          : 'bg-transparent'
      }`}
    >
      <div className="section-wrapper py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/30 group-hover:shadow-neon-blue/50 transition-shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Queue<span className="gradient-text">Swap</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-blue group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-6">
          <a href="http://localhost:4200/login" className="text-text-primary hover:text-neon-cyan transition-colors text-sm font-semibold">
            Sign In
          </a>
          <a href="http://localhost:4200/register">
            <button className="glow-btn text-sm !py-2.5 !px-6">Sign Up</button>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block w-6 h-0.5 bg-text-primary" />
          <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="block w-6 h-0.5 bg-text-primary" />
          <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block w-6 h-0.5 bg-text-primary" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-bg-primary/95 backdrop-blur-xl border-b border-border-glow"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors text-base font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <a href="http://localhost:4200/login" className="text-center text-text-primary hover:text-neon-cyan transition-colors text-base font-semibold py-2">
                  Sign In
                </a>
                <a href="http://localhost:4200/register" className="w-full">
                  <button className="w-full glow-btn text-sm py-3">Sign Up</button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

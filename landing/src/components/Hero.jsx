import { motion } from 'framer-motion';
import ParticlesBackground from './ParticlesBackground';
import HeroToken3D from './HeroToken3D';

export default function Hero() {
  const handleRipple = (e) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - diameter / 2}px`;
    circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - diameter / 2}px`;
    circle.classList.add('ripple');
    const existing = btn.querySelector('.ripple');
    if (existing) existing.remove();
    btn.appendChild(circle);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" id="hero">
      {/* Particles */}
      <ParticlesBackground />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/30 to-bg-primary pointer-events-none z-[1]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-blue/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 section-wrapper grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center pt-40 pb-32 lg:pt-56 lg:pb-48">
        {/* Left text */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col gap-8 lg:gap-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/20 w-fit text-sm text-neon-cyan font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            Now in Early Access
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Skip the Line.{' '}
            <span className="gradient-text">Trade the Time.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed">
            QueueSwap lets you buy or sell your position in real-world queues — for events, restaurants, ticket counters, and stores.
          </p>

          <div className="flex flex-wrap gap-6 mt-4">
            <a href="https://queueswap-app.onrender.com/login">
              <button className="glow-btn text-base" onClick={handleRipple}>
                Get Started
              </button>
            </a>
            <a href="#how-it-works">
              <button className="glow-btn-outline text-base" onClick={handleRipple}>
                See How It Works
              </button>
            </a>
          </div>

          
        </motion.div>

        {/* Right 3D Token */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className="h-[350px] sm:h-[450px] lg:h-[500px] w-full"
        >
          <HeroToken3D />
        </motion.div>
      </div>

      
    </section>
  );
}

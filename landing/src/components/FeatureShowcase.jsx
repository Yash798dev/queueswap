import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import HolographicTicket3D from './HolographicTicket3D';

const features = [
  {
    title: 'NFTicket Ownership',
    desc: 'Secure digital queue ownership backed by blockchain verification.',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: '#3B82F6',
  },
  {
    title: 'Real-time Marketplace',
    desc: 'Live queue position trading with instant price discovery.',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: '#22D3EE',
  },
  {
    title: 'NFC / QR Check-in',
    desc: 'Seamless venue check-in via NFC tap or QR code scan.',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
    color: '#8B5CF6',
  },
  {
    title: 'Fraud Prevention',
    desc: 'Advanced AI-powered anti-fraud ensures legitimate queue positions.',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: '#3B82F6'
  },
];

const HoloFeatureCard = ({ feature, index, isInView }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className="relative group w-full h-full cursor-pointer"
    >
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: feature.color, transform: "translateZ(-20px)" }}
      />
      
      <div 
        className="glass-card p-10 lg:p-14 flex flex-col gap-6 h-full w-full relative z-10 transition-colors duration-300 pointer-events-none"
        style={{ transform: "translateZ(30px)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: `${feature.color}15`,
            color: feature.color,
            boxShadow: `0 0 25px ${feature.color}30`,
          }}
        >
          {feature.icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary mt-2">{feature.title}</h3>
        <p className="text-base text-text-secondary leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
};

export default function FeatureShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '100px' });

  return (
    <section id="features" className="relative py-32 lg:py-48 overflow-hidden min-h-[80vh] flex flex-col justify-center">
      {/* BG */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-blue/3 blur-[180px] rounded-full pointer-events-none" />

      <div className="section-wrapper" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="text-sm font-semibold text-neon-purple uppercase tracking-widest">Features</span>
          <h2 className="section-title mt-3">
            The Future of <span className="gradient-text">Queue Trading</span>
          </h2>
          <div className="glow-line mx-auto mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-24 items-center">
          {/* 3D Ticket */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-[350px] sm:h-[400px] lg:h-[450px] order-2 lg:order-1"
          >
            <HolographicTicket3D />
          </motion.div>

          {/* Feature cards with massive spacing and holographic 3D tilt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-14 lg:ml-8 order-1 lg:order-2 p-4 lg:p-8">
            {features.map((f, i) => (
              <HoloFeatureCard key={f.title} feature={f} index={i} isInView={isInView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

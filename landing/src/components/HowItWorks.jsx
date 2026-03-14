import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    num: '01',
    title: 'Reserve Your Spot',
    desc: 'User joins a queue digitally — no physical waiting required.',
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    color: 'from-neon-blue to-neon-cyan',
    glowColor: 'rgba(59,130,246,0.3)',
  },
  {
    num: '02',
    title: 'Trade Your Position',
    desc: 'Sell or buy queue spots instantly in our real-time marketplace.',
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'from-neon-purple to-neon-blue',
    glowColor: 'rgba(139,92,246,0.3)',
  },
  {
    num: '03',
    title: 'Skip the Wait',
    desc: 'Arrive just in time when it\'s your turn — effortlessly.',
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'from-neon-cyan to-neon-purple',
    glowColor: 'rgba(34,211,238,0.3)',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="relative py-32 lg:py-48 overflow-hidden min-h-[80vh] flex flex-col justify-center">
      {/* BG glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-purple/3 blur-[150px] rounded-full pointer-events-none" />

      <div className="section-wrapper" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24 lg:mb-32"
        >
          <span className="text-sm font-semibold text-neon-cyan uppercase tracking-widest">How It Works</span>
          <h2 className="section-title mt-3">
            Three Simple <span className="gradient-text">Steps</span>
          </h2>
          <div className="glow-line mx-auto mt-4" />
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="glass-card p-10 lg:p-14 flex flex-col items-center text-center gap-6 lg:gap-8 group cursor-default"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              {/* Step number */}
              <div className="text-5xl font-extrabold gradient-text opacity-30 group-hover:opacity-60 transition-opacity">
                {step.num}
              </div>

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}
                style={{ boxShadow: `0 0 30px ${step.glowColor}` }}
              >
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-text-primary">{step.title}</h3>

              {/* Desc */}
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>

              {/* Bottom accent */}
              <div className={`h-0.5 w-12 bg-gradient-to-r ${step.color} rounded-full opacity-50 group-hover:w-20 group-hover:opacity-100 transition-all duration-500`} />
            </motion.div>
          ))}
        </div>

        {/* Connector line (desktop) */}
        <div className="hidden md:flex justify-center mt-[-200px] mb-[200px] pointer-events-none relative z-0">
          <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}

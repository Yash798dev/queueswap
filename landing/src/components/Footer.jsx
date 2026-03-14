export default function Footer() {
  const columns = [
    {
      title: 'Product',
      links: ['Queue Marketplace', 'NFTicket', 'Mobile App', 'API Access', 'Pricing'],
    },
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners'],
    },
    {
      title: 'Support',
      links: ['Help Center', 'Contact', 'Documentation', 'Status', 'Community'],
    },
    {
      title: 'Socials',
      links: ['Twitter / X', 'Discord', 'LinkedIn', 'Instagram', 'GitHub'],
    },
  ];

  return (
    <footer className="relative border-t border-border-glow">
      {/* Glow separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-8 bg-neon-blue/5 blur-[30px]" />

      <div className="section-wrapper py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
              </div>
              <span className="text-lg font-bold">
                Queue<span className="gradient-text">Swap</span>
              </span>
            </a>
            <p className="text-sm text-text-secondary leading-relaxed">
              The future of queue management. Trade your time, skip the line.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {['X', 'D', 'Li', 'In'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-text-secondary hover:border-neon-blue/40 hover:text-neon-blue hover:bg-neon-blue/5 transition-all"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary hover:text-neon-blue transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 pb-8 lg:pb-0 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-xs text-text-secondary">
            © 2026 QueueSwap. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((l) => (
              <a key={l} href="#" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

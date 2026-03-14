import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

import Footer from './components/Footer';

function App() {
  useEffect(() => {
    // Cursor glow effect
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    const handleMouseMove = (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      glow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      <div id="cursor-glow" />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />

      </main>
      <Footer />
    </>
  );
}

export default App;

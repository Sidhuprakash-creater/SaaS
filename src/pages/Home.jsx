import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  LogIn, 
  ChevronRight, 
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          el.classList.add('visible');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div className="mesh-bg"></div>

      {/* Navbar */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: scrolled ? '1rem 8%' : '1.5rem 8%', 
        background: scrolled ? 'rgba(15, 23, 42, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(15px)' : 'none',
        position: 'fixed',
        width: '100%',
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: 'all 0.4s ease',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
            <GraduationCap size={28} color="white" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>EduPortal</span>
        </div>
        
        <div className="home-nav-links" style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
          {['Features', 'About', 'Pricing'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ textDecoration: 'none', color: 'var(--text-dim)', fontWeight: '600', fontSize: '0.95rem' }}>{item}</a>
          ))}
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <LogIn size={18} />
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="home-hero" style={{ 
        padding: '12rem 8% 8rem', 
        textAlign: 'center', 
        position: 'relative'
      }}>
        <div className="reveal-on-scroll" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            padding: '0.5rem 1.25rem', 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary-glow)', 
            borderRadius: '999px', 
            fontWeight: '700', 
            fontSize: '0.875rem',
            marginBottom: '2.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Sparkles size={16} style={{ marginRight: '0.5rem' }} />
            The Future of Education is here
          </div>
          <h1 className="home-hero-title" style={{ 
            fontSize: '5rem', 
            lineHeight: '1.1', 
            fontWeight: '900', 
            color: 'white', 
            marginBottom: '2rem',
            letterSpacing: '-3px'
          }}>
            Teach. Learn. Grow.<br /> 
            <span style={{ 
              background: 'linear-gradient(to right, #6366f1, #ec4899)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>Beyond Boundaries.</span>
          </h1>
          <p className="home-hero-desc" style={{ 
            fontSize: '1.4rem', 
            color: 'var(--text-dim)', 
            maxWidth: '750px', 
            margin: '0 auto 3.5rem',
            lineHeight: '1.6'
          }}>
            Experience the most interactive, data-driven, and sleekest school management system ever built for the next generation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary home-hero-btn"
              style={{ fontSize: '1.1rem', padding: '1.25rem 3rem' }}
            >
              Get Started <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Floating 3D-like elements */}
        <div className="home-float-el" style={{ 
          position: 'absolute', 
          top: '20%', 
          left: '5%', 
          width: '60px', 
          height: '60px', 
          background: 'var(--primary)', 
          borderRadius: '16px',
          opacity: 0.4,
          animation: 'float 6s infinite ease-in-out',
          filter: 'blur(2px)'
        }}></div>
        <div className="home-float-el" style={{ 
          position: 'absolute', 
          bottom: '10%', 
          right: '5%', 
          width: '100px', 
          height: '100px', 
          background: 'var(--secondary)', 
          borderRadius: '50%',
          opacity: 0.3,
          animation: 'float 8s infinite ease-in-out reverse',
          filter: 'blur(30px)'
        }}></div>
      </header>

      {/* Features Section */}
      <section id="features" className="home-features" style={{ padding: '6rem 8%' }}>
        <div className="home-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {[
            { 
              icon: <Zap size={32} color="#6366f1" />, 
              title: "Lightning Speed", 
              desc: "No more waiting. Access attendance, homework, and grades instantly on any device." 
            },
            { 
              icon: <Globe size={32} color="#ec4899" />, 
              title: "Multi-School Hub", 
              desc: "Manage multiple branches or schools from a single, unified dashboard." 
            },
            { 
              icon: <Sparkles size={32} color="#06b6d4" />, 
              title: "AI-Powered Analytics", 
              desc: "Predict student performance using our advanced data models." 
            }
          ].map((f, i) => (
            <div key={i} className="glass-card reveal-on-scroll home-feature-card" style={{ padding: '3rem' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                width: '80px', 
                height: '80px', 
                borderRadius: '24px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: '2rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: '1.7', fontSize: '1.05rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scroll-Revealed CTA */}
      <section className="reveal-on-scroll home-cta" style={{ margin: '4rem 8%', padding: '6rem 4rem', textAlign: 'center' }}>
        <div className="glass-card home-cta-inner" style={{ padding: '4rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)' }}>
          <h2 className="home-cta-title" style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', color: 'white' }}>Ready to Modernize Your School?</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Join thousands of schools already using EduPortal to provide a better future for their students.
          </p>
          <button className="btn-primary" style={{ margin: '0 auto', fontSize: '1.1rem', padding: '1rem 3.5rem' }} onClick={() => navigate('/login')}>
            Get Started Now
          </button>
        </div>
      </section>

      <footer className="home-footer" style={{ padding: '6rem 8% 4rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-dim)', fontWeight: '500' }}>© 2026 EduPortal Systems. Engineered for the Future.</p>
      </footer>

      {/* ======= MOBILE RESPONSIVE CSS ======= */}
      <style>{`
        @media (max-width: 768px) {
          /* Navbar */
          .home-nav-links {
            gap: 1.5rem !important;
          }
          .home-nav-links a {
            display: none !important;
          }
          .home-nav-links .btn-primary {
            padding: 0.6rem 1.2rem !important;
            font-size: 0.9rem !important;
          }

          /* Hero */
          .home-hero {
            padding: 8rem 5% 4rem !important;
          }
          .home-hero-title {
            font-size: 2.8rem !important;
            letter-spacing: -1.5px !important;
          }
          .home-hero-desc {
            font-size: 1.05rem !important;
            margin-bottom: 2rem !important;
          }
          .home-hero-btn {
            font-size: 1rem !important;
            padding: 1rem 2rem !important;
          }
          .home-float-el {
            display: none !important;
          }

          /* Features */
          .home-features {
            padding: 3rem 5% !important;
          }
          .home-features-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .home-feature-card {
            padding: 2rem !important;
          }
          .home-feature-card h3 {
            font-size: 1.3rem !important;
          }
          .home-feature-card p {
            font-size: 0.95rem !important;
          }

          /* CTA */
          .home-cta {
            margin: 2rem 5% !important;
            padding: 0 !important;
          }
          .home-cta-inner {
            padding: 2.5rem 1.5rem !important;
            border-radius: 20px !important;
          }
          .home-cta-title {
            font-size: 1.8rem !important;
          }
          .home-cta-inner p {
            font-size: 1rem !important;
          }
          .home-cta-inner .btn-primary {
            padding: 0.9rem 2rem !important;
            font-size: 1rem !important;
          }

          /* Footer */
          .home-footer {
            padding: 3rem 5% 2rem !important;
          }
        }

        @media (max-width: 400px) {
          .home-hero {
            padding: 7rem 4% 3rem !important;
          }
          .home-hero-title {
            font-size: 2.2rem !important;
            letter-spacing: -1px !important;
          }
          .home-hero-desc {
            font-size: 0.95rem !important;
          }
          .home-features {
            padding: 2rem 4% !important;
          }
          .home-feature-card {
            padding: 1.5rem !important;
          }
          .home-cta {
            margin: 1.5rem 4% !important;
          }
          .home-cta-inner {
            padding: 2rem 1.2rem !important;
          }
          .home-cta-title {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Youtube, MessageSquare, Play, ShoppingCart, Users, ChevronDown, User, Coins, Zap, Menu, X } from 'lucide-react';
import ArcButton from './components/ArcButton';
import ProfileOverlay from './components/ProfileOverlay';
import AuthButton from './components/AuthButton';
import AdminDashboard from './components/AdminDashboard';
import ChatOverlay from './components/ChatOverlay';
import heroBg from './assets/hero-bg.png';
import logoImg from './assets/logo.png';
import { supabase } from './lib/supabase';

function App() {
  const [lang, setLang] = useState('TH');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [credits, setCredits] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null); // To store admin's own data
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, credits')
          .eq('id', user.id)
          .single();

        if (data) {
          setRole(data.role || 'user');
          setCredits(data.credits || 0);
        } else if (error) {
          console.error('Fetch error:', error.message, error);
        }
      };
      fetchProfile();
    } else {
      setRole('user');
      setCredits(0);
    }
  }, [user]);


  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="app-container">
      <div className="scanline"></div>

      <ProfileOverlay
        user={impersonatedUser || user}
        role={role}
        credits={credits}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onCreditsUpdate={(newBalance) => setCredits(newBalance)}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
      />

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={user}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Sticky Header */}
      <header style={headerStyle}>
        {/* Mobile Menu Toggle - visible on mobile only */}
        <div className="hide-desktop" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ cursor: 'pointer', zIndex: 1002, color: '#fff' }}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        {/* Logo/Brand for Mobile - or empty spacer */}
        <div className="hide-desktop" style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
          ARC RAIDERS
        </div>


        {/* Desktop Left Social Icons - hidden on mobile */}
        <div className="header-left hide-mobile" style={socialIconsStyle}>
          <Facebook size={20} className="hover-white" />
          <MessageSquare size={20} className="hover-white" />
          <Youtube size={20} className="hover-white" />
        </div>

        {/* Desktop Nav - hidden on mobile */}
        <nav className="header-center hide-mobile" style={navStyle}>
          <a href="#" className="hover-cyan">COMMUNITY</a>
          <a href="https://www.facebook.com/profile.php?id=61582500973596" target="_blank" rel="noreferrer" className="hover-cyan">NEWS</a>
          <a href="#" className="hover-cyan">GAME INFO</a>
          <a href="#" className="hover-cyan">MARKET</a>
        </nav>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100vh',
                background: 'rgba(5, 5, 5, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 1001,
                padding: '80px 30px',
                borderRight: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavLink}>COMMUNITY</a>
              <a href="https://www.facebook.com/profile.php?id=61582500973596" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavLink}>NEWS</a>
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavLink}>GAME INFO</a>
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavLink}>MARKET</a>

              <div style={{ height: '1px', background: '#333', margin: '20px 0' }}></div>

              <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
                <Facebook size={24} className="hover-white" />
                <Youtube size={24} className="hover-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="header-right" style={headerRightStyle}>
          <AuthButton user={user} />

          {user && (
            <>
              <div
                onClick={() => setIsChatOpen(true)}
                style={{
                  ...iconButtonStyle,
                  color: 'var(--arc-cyan)',
                  borderColor: 'rgba(0, 200, 255, 0.3)',
                  background: 'rgba(0, 200, 255, 0.1)'
                }}
                className="hover-cyan"
              >
                <MessageSquare size={16} />
                {unreadCount > 0 && (
                  <div style={badgeStyle}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              <div style={{
                ...iconButtonStyle,
                color: 'var(--arc-yellow)',
                borderColor: 'rgba(255, 200, 0, 0.3)',
                background: 'rgba(255, 200, 0, 0.1)'
              }}>
                <Coins size={16} />
                {!isMobile && <span>{credits}</span>}
              </div>
            </>
          )}

          {user && (
            <div
              onClick={() => setIsProfileOpen(true)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--arc-cyan)',
                background: 'rgba(255,255,255,0.05)',
                padding: '6px',
                borderRadius: '50%',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}
              title="Open Profile"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <User size={18} />
              )}
            </div>
          )}
          <div
            onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
            style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            {lang}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" style={heroStyle}>
        {/* YouTube Video Background Overlay */}
        <div style={videoBgWrapperStyle}>
          <iframe
            src="https://www.youtube.com/embed/xuftkDxjGT4?autoplay=1&mute=1&controls=0&loop=1&playlist=xuftkDxjGT4&showinfo=0&rel=0&iv_load_policy=3&start=13&end=164"
            title="Hero Background Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={videoBgIframeStyle}
          ></iframe>
          <div className="bg-pattern-overlay"></div>
          <div className="bg-dots"></div>
          <div style={videoOverlayStyle}></div>
          <div style={bottomFadeStyle}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{
            ...heroContentStyle,
            padding: isMobile ? '0 15px' : '0 20px'
          }}
        >
          <img src={logoImg} alt="ARC RAIDERS" style={logoImgStyle} />
          <h2 style={{
            ...taglineStyle,
            fontSize: isMobile ? '16px' : '24px',
            letterSpacing: isMobile ? '4px' : '8px',
            marginBottom: isMobile ? '30px' : '40px'
          }}>AVAILABLE NOW</h2>

          <div style={{
            ...heroActionsStyle,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? '15px' : '20px'
          }}>
            <ArcButton color="blue" onClick={() => window.open('https://store.steampowered.com/app/1808500/ARC_Raiders/', '_blank')} style={{ width: isMobile ? '100%' : 'auto' }}>
              <ShoppingCart size={20} /> STEAM
            </ArcButton>
            <ArcButton color="green" onClick={() => scrollToSection('trailers')} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Play size={20} /> WATCH TRAILERS
            </ArcButton>
            <ArcButton color="red" style={{ width: isMobile ? '100%' : 'auto' }}>
              <Users size={20} /> MISSION BOARD
            </ArcButton>
          </div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={() => scrollToSection('trailers')}
            style={{ marginTop: '50px', cursor: 'pointer' }}
          >
            <ChevronDown size={40} className="text-cyan" />
            <p style={{ fontSize: '12px', letterSpacing: '2px' }}>SCROLL</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Trailer Section */}
      <section id="trailers" style={{ ...sectionStyle, backgroundColor: '#050505', padding: isMobile ? '60px 20px' : '100px 20px' }}>
        <h3 style={{ ...sectionTitleStyle, fontSize: isMobile ? '24px' : '32px' }}>OFFICIAL TRAILERS</h3>
        <div style={videoContainerStyle}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/QywhD8zfppM"
            title="ARC Raiders Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '8px', boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)' }}
          ></iframe>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" style={{ ...sectionStyle, padding: isMobile ? '60px 20px' : '100px 20px' }}>
        <h3 style={{ ...sectionTitleStyle, fontSize: isMobile ? '20px' : '32px' }}>PLAY ON YOUR FAVORITE PLATFORM</h3>
        <div style={{
          ...platformGridStyle,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {['STEAM', 'EPIC GAMES', 'PLAYSTATION 5', 'XBOX SERIES X|S', 'GEFORCE NOW'].map((p) => (
            <div key={p} className="platform-item" style={{
              ...platformItemStyle,
              width: isMobile ? '100%' : 'auto'
            }}>
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '20px' : '40px',
          marginBottom: '20px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <a href="#" className="hover-white">MARKET</a>
          <a href="#" className="hover-white">SHOP</a>
          <a href="#" className="hover-white">HELP</a>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '0 20px' }}>
          © 2026 ARC RAIDERS MINI PROJECT. ALL RIGHTS RESERVED.
        </p>
        <p style={{ color: 'var(--arc-cyan)', fontSize: '12px', marginTop: '10px' }}>v1.0.0-BETA</p>
      </footer>

      {/* Global Style Injections (Quick and Dirty for Mini Project) */}
      <style>{`
        .hover-white:hover { color: #fff; cursor: pointer; }
        .hover-cyan:hover { color: var(--arc-cyan); }
        .platform-item:hover { border-color: #fff; background: rgba(255,255,255,0.05); }
        
        @media (max-width: 768px) {
            .app-container {
                overflow-x: hidden;
            }
        }
      `}</style>

      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div style={impersonationBannerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Users size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMobile ? 'ADMIN MODE: ' : 'IMPERSONATING: '}
              <span style={{ color: 'var(--arc-yellow)' }}>{impersonatedUser.email?.split('@')[0]}</span>
            </span>
          </div>
          <button
            onClick={() => {
              setImpersonatedUser(null);
              setCredits(originalUserData.credits);
              setRole(originalUserData.role);
            }}
            style={exitImpersonationButtonStyle}
          >
            EXIT
          </button>
        </div>
      )}

      {isAdminDashboardOpen && (
        <AdminDashboard
          role={role}
          onClose={() => setIsAdminDashboardOpen(false)}
          onLoginAs={(targetUser) => {
            if (!impersonatedUser) {
              setOriginalUserData({ credits, role });
            }
            setImpersonatedUser(targetUser);
            setCredits(targetUser.credits || 0);
            setRole(targetUser.role || 'user');
            setIsAdminDashboardOpen(false);
          }}
        />
      )}
    </div >
  );
}

// Inline Styles
const headerStyle = {
  position: 'fixed',
  top: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 20px', // Reduced padding for better mobile fit
  zIndex: 1000,
  background: '#000',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  height: '70px'
};

const socialIconsStyle = {
  display: 'flex',
  gap: '20px',
  color: 'var(--text-secondary)',
};

const navStyle = {
  display: 'flex',
  gap: '30px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  fontSize: '14px',
};

const mobileNavLink = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#fff',
  textDecoration: 'none',
  letterSpacing: '2px'
};

const headerRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px', // Reduced gap for mobile
};

const iconButtonStyle = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: '20px',
  border: '1px solid',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.2s',
  position: 'relative'
};

const badgeStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#ff0000',
  color: '#fff',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: 'bold',
  boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
};

const heroStyle = {
  height: '100vh',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  overflow: 'hidden',
};

const videoBgWrapperStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1,
};

const videoBgIframeStyle = {
  width: '100vw',
  height: '56.25vw', /* 16:9 Aspect Ratio */
  minHeight: '100vh',
  minWidth: '177.77vh', /* 16:9 Aspect Ratio */
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
};

const videoOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.8) 100%)',
  zIndex: 1,
};

const bottomFadeStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '20vh',
  background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
  zIndex: 1,
};

const heroContentStyle = {
  maxWidth: '800px',
  padding: '0 20px',
  position: 'relative',
  zIndex: 2,
  width: '100%'
};

const logoImgStyle = {
  width: '100%',
  maxWidth: '600px',
  marginBottom: '20px',
};

const taglineStyle = {
  fontWeight: '300',
  letterSpacing: '8px',
  marginBottom: '40px',
  color: 'rgba(255,255,255,0.8)',
};

const heroActionsStyle = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const sectionStyle = {
  padding: '100px 20px',
  textAlign: 'center',
};

const sectionTitleStyle = {
  fontWeight: '700',
  letterSpacing: '2px',
  marginBottom: '60px',
  textTransform: 'uppercase',
};

const platformGridStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  flexWrap: 'wrap',
};

const platformItemStyle = {
  border: '1px solid #333',
  padding: '15px 30px',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  minWidth: '200px',
};

const videoContainerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  aspectRatio: '16/9',
};

const footerStyle = {
  padding: '60px 20px',
  borderTop: '1px solid #111',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  paddingBottom: '120px' // Added padding for the banner
};

const impersonationBannerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  background: 'rgba(255, 0, 0, 0.9)',
  color: 'white',
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10001,
  boxShadow: '0 -10px 30px rgba(255, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
  borderTop: '2px solid rgba(255, 255, 255, 0.2)'
};

const exitImpersonationButtonStyle = {
  background: 'white',
  color: 'red',
  border: 'none',
  padding: '6px 15px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};

export default App;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Youtube, MessageSquare, Play, ShoppingCart, Users, ChevronDown, User, Coins, Zap, Menu, X, Briefcase } from 'lucide-react';
import ArcButton from './components/ArcButton';
import UserDropdown from './components/UserDropdown';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import CreditTopupModal from './components/CreditTopupModal'; // Import Topup Modal directly
import AuthButton from './components/AuthButton';
import AdminDashboard from './components/AdminDashboard';
import ChatOverlay from './components/ChatOverlay';
import Traders from './components/Traders';
import MissionBoard from './components/MissionBoard';
import CommunityBoard from './components/CommunityBoard';
import OnlineTicker from './components/OnlineTicker';
import HeroVideo from './components/HeroVideo';
import logoImg from './assets/logo.png';
import { supabase } from './lib/supabase';
import { useLanguage } from './lib/LanguageContext';

function App() {
  const { lang, t, toggleLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [credits, setCredits] = useState(0);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // Changed from isProfileOpen
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false); // New state for Topup Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // New state for History Modal
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null); // To store admin's own data
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'traders', 'community'
  const [isGameInfoOpen, setIsGameInfoOpen] = useState(false);
  const [chatTrigger, setChatTrigger] = useState({ user: null, message: '' });

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
    const targetUser = impersonatedUser || user;
    if (targetUser) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, credits, email, avatar_url')
          .eq('id', targetUser.id)
          .single();

        if (data) {
          console.log('--- FETCH PROFILE SUCCESS ---');
          // Self-healing: Sync Avatar from Auth Metadata to Profile if missing
          // Only perform this for the actual logged-in user to avoid overwriting during impersonation
          if (!impersonatedUser && !data.avatar_url && user?.user_metadata?.avatar_url) {
            console.log('Syncing missing avatar to profile...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: user.user_metadata.avatar_url })
              .eq('id', user.id);

            if (!updateError) {
              console.log('Avatar synced successfully');
            }
          }

          console.log('Target User ID:', targetUser.id);
          console.log('Profile Data Returned:', data);
          console.log('Setting Role To:', data.role || 'user');
          setRole(data.role || 'user');
          setCredits(data.credits || 0);

          if (impersonatedUser) {
            // Check if values actually changed to avoid infinite loop
            const hasChanged =
              impersonatedUser.credits !== data.credits ||
              impersonatedUser.role !== (data.role || 'user');

            if (hasChanged) {
              console.log('--- UPDATING IMPERSONATED USER STATE ---');
              setImpersonatedUser({
                ...impersonatedUser,
                credits: data.credits || 0,
                role: data.role || 'user',
                email: data.email || impersonatedUser.email,
                user_metadata: {
                  ...impersonatedUser.user_metadata,
                  email: data.email || impersonatedUser.email
                }
              });
            }
          }
        } else if (error) {
          console.error('Fetch error:', error.message, error);
        }
      };
      fetchProfile();
    } else {
      setRole('user');
      setCredits(0);
    }
  }, [user?.id, impersonatedUser?.id]);


  useEffect(() => {
    // Lock body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevent touch scrolling on background
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }
  }, [isMobileMenuOpen]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserDropdownOpen(false);
  };

  return (
    <div className="app-container" style={{
      background: '#000',
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      <div className="scanline"></div>

      {/* --- MODALS & OVERLAYS (Not Scaled) --- */}

      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        user={impersonatedUser || user}
      />

      {/* Replaced ProfileOverlay with TopupModal here, Dropdown is in Header */}
      <CreditTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        user={impersonatedUser || user}
        onTopupSuccess={(newBalance) => setCredits(newBalance)}
      />

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatTrigger({ user: null, message: '' });
        }}
        currentUser={user}
        onUnreadCountChange={setUnreadCount}
        targetUser={chatTrigger.user}
        initialMessage={chatTrigger.message}
      />

      {isAdminDashboardOpen && (
        <AdminDashboard
          role={role}
          onClose={() => setIsAdminDashboardOpen(false)}
          onLoginAs={async (targetUser) => {
            if (!impersonatedUser) {
              setOriginalUserData({ credits, role });
            }
            // Fetch target user profile immediately to ensure we have latest credits/role
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', targetUser.id)
              .single();

            const mergedUser = {
              ...targetUser,
              ...profile,
              user_metadata: {
                ...targetUser.user_metadata,
                avatar_url: profile?.avatar_url || targetUser.user_metadata?.avatar_url
              }
            };

            setImpersonatedUser(mergedUser);
            setCredits(mergedUser.credits || 0);
            setRole(mergedUser.role || 'user');
            console.log('--- IMPERSONATION STARTED ---');
            console.log('Merged User:', mergedUser);
            console.log('Credits Set:', mergedUser.credits);
            console.log('Role Set:', mergedUser.role);
            setIsAdminDashboardOpen(false);
          }}
        />
      )}

      {/* --- MOBILE DRAWER (Not Scaled) --- */}
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
            {/* Close Button specific for Drawer */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '25px',
                right: '25px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)',
                padding: '5px'
              }}
            >
              <X size={28} />
            </div>

            {/* Mobile Credits Display */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 200, 0, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 200, 0, 0.3)',
                color: 'var(--arc-yellow)',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                <Coins size={20} />
                <span>{t('CREDITS')}: {credits}</span>
              </div>
            )}

            <a href="#" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} style={mobileNavLink}>{t('HOME')}</a>
            <a href="#" onClick={() => { setCurrentView('community'); setIsMobileMenuOpen(false); }} style={mobileNavLink}>{t('COMMUNITY')}</a>
            <a href="https://arcraiders.com/news" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavLink}>{t('NEWS')}</a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ ...mobileNavLink, color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{t('GAME_INFO')}</span>
              <a href="#" onClick={() => { setCurrentView('traders'); setIsMobileMenuOpen(false); }} style={{ ...mobileNavLink, paddingLeft: '20px', fontSize: '20px' }}>- {t('TRADERS')}</a>
            </div>
            <a href="#" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} style={mobileNavLink}>{t('MARKET')}</a>

            <div style={{ height: '1px', background: '#333', margin: '10px 0' }}></div>

            {/* Language Toggle in Drawer */}
            <div
              onClick={() => { toggleLang(); setIsMobileMenuOpen(false); }}
              style={{ ...mobileNavLink, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <span>{t('LANGUAGE')}:</span>
              <span style={{ color: 'var(--arc-cyan)' }}>{lang}</span>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
              <Facebook size={24} className="hover-white" />
              <Youtube size={24} className="hover-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT (Scaled when menu open) --- */}
      <motion.div
        animate={{
          scale: isMobileMenuOpen ? 0.92 : 1,
          borderRadius: isMobileMenuOpen ? '20px' : '0px',
          translateX: isMobileMenuOpen ? '260px' : '0px',
          opacity: isMobileMenuOpen ? 0.4 : 1
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={{
          transformOrigin: 'top left',
          minHeight: '100vh',
          background: '#0a0a0a',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden', // Contain contents
          boxShadow: isMobileMenuOpen ? '-20px 0 50px rgba(0,0,0,0.5)' : 'none',
          pointerEvents: isMobileMenuOpen ? 'none' : 'auto'
        }}
        onClick={() => {
          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        }}
      >
        {/* Sticky Header */}
        <header style={{
          ...headerStyle,
          position: 'fixed',
          width: '100%',
          backdropFilter: 'blur(10px)',
          background: 'rgba(5, 5, 5, 0.8)',
        }}>
          {/* Mobile Menu Toggle - visible on mobile only */}
          <div className="hide-desktop" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ cursor: 'pointer', zIndex: 1002, color: '#fff', padding: '5px' }}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </div>

          {/* Logo/Brand for Mobile */}
          <div className="hide-desktop" style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', marginLeft: '10px' }}>
            ARC RAIDERS TH MARKETPLACE
          </div>

          {/* Desktop Left Social Icons - hidden on mobile */}
          <div className="header-left hide-mobile" style={socialIconsStyle}>
            <Facebook size={20} className="hover-white" />
            <MessageSquare size={20} className="hover-white" />
            <Youtube size={20} className="hover-white" />
          </div>

          {/* Desktop Nav - hidden on mobile */}
          <nav className="header-center hide-mobile" style={navStyle}>
            <a href="#" className="hover-cyan" onClick={() => setCurrentView('home')}>{t('HOME')}</a>
            <a href="#" className="hover-cyan" onClick={() => setCurrentView('community')}>{t('COMMUNITY')}</a>
            <a href="https://arcraiders.com/news" target="_blank" rel="noreferrer" className="hover-cyan">{t('NEWS')}</a>

            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsGameInfoOpen(true)}
              onMouseLeave={() => setIsGameInfoOpen(false)}
            >
              <a href="#" className="hover-cyan" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {t('GAME_INFO')} <ChevronDown size={14} />
              </a>
              <AnimatePresence>
                {isGameInfoOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      background: '#0a0a0a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 0',
                      minWidth: '180px',
                      zIndex: 1000,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      marginTop: '10px'
                    }}
                  >
                    <div
                      onClick={() => { setCurrentView('traders'); setIsGameInfoOpen(false); }}
                      style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      className="hover-cyan-bg"
                    >
                      {t('TRADERS')}
                    </div>
                    {/* Placeholder for other game info items */}
                    <div style={{ padding: '10px 20px', opacity: 0.5, fontSize: '14px' }}>WIKI (SOON)</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#" className="hover-cyan" onClick={() => setCurrentView('home')}>{t('MARKET')}</a>
          </nav>

          <div className="header-right" style={{ ...headerRightStyle, gap: isMobile ? '8px' : '20px' }}>
            <AuthButton user={user} />

            {user && (
              <>
                <div
                  onClick={() => setIsChatOpen(true)}
                  style={{
                    ...iconButtonStyle,
                    color: 'var(--arc-cyan)',
                    borderColor: 'rgba(0, 200, 255, 0.3)',
                    background: 'rgba(0, 200, 255, 0.1)',
                    padding: isMobile ? '6px 8px' : '6px 12px'
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

                {/* Desktop Only Credits Display */}
                <div className="hide-mobile" style={{
                  ...iconButtonStyle,
                  color: 'var(--arc-yellow)',
                  borderColor: 'rgba(255, 200, 0, 0.3)',
                  background: 'rgba(255, 200, 0, 0.1)'
                }}>
                  <Coins size={16} />
                  <span>{credits}</span>
                </div>
              </>
            )}

            {user && (
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <div
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
                  title="Profile"
                >
                  {(impersonatedUser || user)?.user_metadata?.avatar_url ? (
                    <img
                      src={(impersonatedUser || user).user_metadata.avatar_url}
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

                {/* User Dropdown */}
                <UserDropdown
                  user={impersonatedUser || user}
                  role={role}
                  isOpen={isUserDropdownOpen}
                  onClose={() => setIsUserDropdownOpen(false)}
                  onLogout={handleLogout}
                  onOpenAdmin={() => {
                    setIsAdminDashboardOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                  onOpenTopUp={() => {
                    setIsTopupModalOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                  onOpenHistory={() => {
                    setIsHistoryOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                />
              </div>
            )}

            {/* Desktop Only Lang Toggle */}
            <div
              className="hide-mobile"
              onClick={toggleLang}
              style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              {lang}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hero Section */}
              <section id="hero" style={heroStyle}>
                {/* YouTube Video Background Overlay */}
                <div style={videoBgWrapperStyle}>
                  <HeroVideo
                    videoId="xuftkDxjGT4"
                    start={13}
                    end={164}
                    style={videoBgIframeStyle}
                  />
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
                  }}>{t('AVAILABLE_NOW')}</h2>

                  <div style={{
                    ...heroActionsStyle,
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center',
                    gap: isMobile ? '15px' : '20px'
                  }}>
                    <ArcButton color="blue" onClick={() => window.open('https://store.steampowered.com/app/1808500/ARC_Raiders/', '_blank')} style={{ width: isMobile ? '100%' : 'auto' }}>
                      <ShoppingCart size={20} /> STEAM
                    </ArcButton>
                    <ArcButton color="green" onClick={() => scrollToSection('mission-board')} style={{ width: isMobile ? '100%' : 'auto' }}>
                      <Briefcase size={20} style={{ marginRight: '8px' }} /> {t('MISSION_BOARD')}
                    </ArcButton>
                    <ArcButton color="red" onClick={() => setCurrentView('community')} style={{ width: isMobile ? '100%' : 'auto' }}>
                      <Users size={20} /> {t('COMMUNITY')}
                    </ArcButton>
                  </div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    onClick={() => scrollToSection('mission-board')}
                    style={{ marginTop: '50px', cursor: 'pointer' }}
                  >
                    <ChevronDown size={40} className="text-cyan" />
                    <p style={{ fontSize: '12px', letterSpacing: '2px' }}>{t('SCROLL')}</p>
                  </motion.div>
                </motion.div>
              </section>

              {/* Mission Board Section */}
              <section id="mission-board" style={{ ...sectionStyle, backgroundColor: '#050505', padding: isMobile ? '40px 10px' : '80px 20px' }}>
                <MissionBoard
                  currentUser={user}
                  onContact={(mission) => {
                    if (!user) {
                      alert(t('PLEASE_LOGIN'));
                      return;
                    }
                    if (mission?.user) {
                      setChatTrigger({
                        user: {
                          id: mission.user.id,
                          email: mission.user.name
                        },
                        message: `สวัสดีครับ ผมสนใจภารกิจ "${mission.title}" ที่คุณประกาศไว้ครับ`
                      });
                      setIsChatOpen(true);
                    }
                  }}
                />
                <OnlineTicker />
              </section>

              {/* Platforms Section */}
              <section id="platforms" style={{ ...sectionStyle, padding: isMobile ? '60px 20px' : '100px 20px' }}>
                <h3 style={{ ...sectionTitleStyle, fontSize: isMobile ? '20px' : '32px' }}>{t('PLAY_ON_PLATFORM')}</h3>
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
            </motion.div>
          ) : currentView === 'traders' ? (
            <motion.div
              key="traders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Traders />
            </motion.div>
          ) : (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <CommunityBoard currentUser={impersonatedUser || user} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer style={footerStyle}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '20px' : '40px',
            marginBottom: '20px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <a href="#" className="hover-white">{t('MARKET')}</a>
            <a href="#" className="hover-white">{t('SHOP')}</a>
            <a href="#" className="hover-white">{t('HELP')}</a>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '0 20px' }}>
            ARC RAIDERS THAILAND เป็นเว็บชุมชนสำหรับแฟนเกม มุ่งมั่นที่จะเชื่อมต่อผู้เล่นเข้าด้วยกัน ไม่ได้เกี่ยวข้องหรือได้รับการรับรองจาก Embark Studios พัฒนาโดย : Mommoei
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '0 20px' }}>
            © 2026 ARC RAIDERS MINI PROJECT. {t('ALL_RIGHTS')}.
          </p>
          <p style={{ color: 'var(--arc-cyan)', fontSize: '12px', marginTop: '10px' }}>v1.1.0-BETA</p>
        </footer>

        {/* Global Style Injections (Quick and Dirty for Mini Project) */}
        <style>{`
        .hover-white:hover { color: #fff; cursor: pointer; }
        .hover-cyan:hover { color: var(--arc-cyan); }
        .hover-cyan-bg:hover { background: rgba(0, 255, 255, 0.1); color: var(--arc-cyan); }
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
                {isMobile ? t('ADMIN_MODE') : t('IMPERSONATING')}
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
              {t('EXIT')}
            </button>
          </div>
        )}
      </motion.div>
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
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
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
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)', // Made darker
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
  fontWeight: '900',
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

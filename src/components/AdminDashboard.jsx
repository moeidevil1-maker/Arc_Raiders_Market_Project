import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Shield,
    Users,
    Search,
    RefreshCw,
    X,
    LayoutDashboard,
    Activity,
    Settings,
    Database,
    FileText,
    LogOut,
    ExternalLink,
    ChevronRight,
    Zap,
    Lock,
    Menu // Added Menu icon for mobile toggle
} from 'lucide-react';
import ArcButton from './ArcButton';
import { AnimatePresence, motion } from 'framer-motion';

const AdminDashboard = ({ role: currentUserRole, onClose, onLoginAs }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        fetchUsers();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        setIsUpdating(userId);
        const newRole = currentRole?.toLowerCase() === 'admin' ? 'user' : 'admin';
        try {
            const targetUser = users.find(u => u.id === userId);
            if (targetUser?.role?.toLowerCase() === 'owner') {
                alert('Owner role cannot be modified.');
                return;
            }
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error.message);
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- SUB-VIEWS ---

    const DashboardView = () => (
        <div style={{ ...contentPadding, padding: isMobile ? '20px' : '30px' }}>
            <div style={{ ...headerSection, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '10px' : '0' }}>
                <h2 style={{ ...viewTitle, fontSize: isMobile ? '20px' : '24px' }}>SYSTEM DASHBOARD</h2>
                <div style={badgeRow}>
                    <span style={onlineStatus}>LIVE STATUS</span>
                    <span style={versionBadge}>V1.2.0-ARC</span>
                </div>
            </div>

            <div style={{ ...metricsGrid, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={metricCard}>
                    <Users size={20} color="var(--arc-cyan)" />
                    <div>
                        <p style={metricLabel}>TOTAL PLAYERS</p>
                        <p style={metricValue}>{users.length}</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Zap size={20} color="var(--arc-yellow)" />
                    <div>
                        <p style={metricLabel}>ACTIVE SESSIONS</p>
                        <p style={metricValue}>12</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Activity size={20} color="#00ff00" />
                    <div>
                        <p style={metricLabel}>SYSTEM LOAD</p>
                        <p style={metricValue}>1.2%</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Database size={20} color="#ff00ff" />
                    <div>
                        <p style={metricLabel}>DB LATENCY</p>
                        <p style={metricValue}>24ms</p>
                    </div>
                </div>
            </div>

            <div style={mainContentArea}>
                <div style={performanceCard}>
                    <h3 style={cardTitle}>Performance Metrics</h3>
                    <div style={progressBarContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>PAGE LOAD TIME</span>
                            <span style={{ color: '#00ff00' }}>482ms</span>
                        </div>
                        <div style={progressBarBg}><div style={{ ...progressBarFill, width: '35%', background: '#00ff00' }}></div></div>
                    </div>
                    <div style={progressBarContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>API RESPONSE</span>
                            <span style={{ color: 'var(--arc-yellow)' }}>1.2s</span>
                        </div>
                        <div style={progressBarBg}><div style={{ ...progressBarFill, width: '75%', background: 'var(--arc-yellow)' }}></div></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const UserManagementView = () => (
        <div style={{ ...contentPadding, padding: isMobile ? '20px' : '30px' }}>
            <div style={{ ...headerSection, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '15px' : '0' }}>
                <h2 style={{ ...viewTitle, fontSize: isMobile ? '20px' : '24px' }}>USER MANAGEMENT</h2>
                <div style={{ ...searchBarContainer, width: isMobile ? '100%' : 'auto' }}>
                    <Search size={18} color="rgba(255,255,255,0.4)" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        style={{ ...searchInputStyle, width: isMobile ? '100%' : '200px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <RefreshCw
                        size={18}
                        style={{ cursor: 'pointer', marginLeft: '10px' }}
                        onClick={fetchUsers}
                        className={loading ? 'spin' : ''}
                    />
                </div>
            </div>

            <div style={tableWrapper}>
                {loading ? (
                    <div style={centeredStyle}>INITIALIZING ENCRYPTED DATA...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ ...tableStyle, minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>EMAIL IDENTITY</th>
                                    <th style={thStyle}>CREDITS</th>
                                    <th style={thStyle}>CLEARANCE</th>
                                    <th style={thStyle}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} style={trStyle}>
                                        <td style={tdStyle}>{user.email || 'N/A'}</td>
                                        <td style={tdStyle}>{user.credits || 0}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                ...roleBadgeStyle,
                                                backgroundColor: user.role?.toLowerCase() === 'owner' ? '#ff00ff' : (user.role?.toLowerCase() === 'admin' ? '#ff4444' : '#333'),
                                                boxShadow: user.role?.toLowerCase() === 'owner' ? '0 0 10px rgba(255, 0, 255, 0.4)' : 'none',
                                                border: user.role?.toLowerCase() === 'owner' ? '1px solid #ff00ff' : 'none'
                                            }}>
                                                {user.role?.toUpperCase() || 'USER'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {user.role?.toLowerCase() === 'owner' ? (
                                                <span style={{ color: '#ff00ff', fontSize: '10px', fontWeight: 'bold' }}>GOD MODE</span>
                                            ) : (
                                                currentUserRole?.toLowerCase() === 'owner' || (currentUserRole?.toLowerCase() === 'admin' && user.role?.toLowerCase() === 'user') ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <ArcButton
                                                            color={user.role?.toLowerCase() === 'admin' ? "red" : "yellow"}
                                                            style={{ padding: '4px 0', fontSize: '10px', width: '85px', justifyContent: 'center' }}
                                                            onClick={() => toggleRole(user.id, user.role)}
                                                            disabled={isUpdating === user.id}
                                                        >
                                                            {isUpdating === user.id ? '...' : (user.role?.toLowerCase() === 'admin' ? 'DEMOTE' : 'MAKE ADMIN')}
                                                        </ArcButton>
                                                        <ArcButton
                                                            color="blue"
                                                            style={{ padding: '4px 0', fontSize: '10px', width: '85px', justifyContent: 'center' }}
                                                            onClick={() => onLoginAs(user)}
                                                        >
                                                            LOGIN AS
                                                        </ArcButton>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}><Lock size={12} style={{ marginRight: '4px' }} /> LOCKED</span>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'users', label: 'User Management', icon: <Users size={18} /> },
        { id: 'health', label: 'System Health', icon: <Activity size={18} /> },
        { id: 'logs', label: 'Access Logs', icon: <FileText size={18} /> },
        { id: 'settings', label: 'General Settings', icon: <Settings size={18} /> },
    ];

    return (
        <div style={overlayStyle}>
            <div style={containerStyle}>
                {/* Mobile Drawer Backdrop */}
                <AnimatePresence>
                    {isMobile && isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.8)',
                                zIndex: 10
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <motion.div
                    initial={false}
                    animate={{
                        x: isMobile ? (isSidebarOpen ? 0 : '-100%') : 0,
                        width: isMobile ? '280px' : '260px'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        ...sidebarStyle,
                        position: isMobile ? 'absolute' : 'relative',
                        zIndex: 20,
                        height: '100%',
                        boxShadow: isMobile && isSidebarOpen ? '5px 0 30px rgba(0,0,0,0.5)' : 'none'
                    }}
                >
                    <div style={brandingArea}>
                        <Shield className="text-yellow" size={24} />
                        <span style={brandingText}>SYSTEM CONTROL</span>
                        {isMobile && (
                            <div style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>
                                <X size={20} color="rgba(255,255,255,0.5)" />
                            </div>
                        )}
                    </div>

                    <div style={menuContainer}>
                        {menuItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (isMobile) setIsSidebarOpen(false);
                                }}
                                style={{
                                    ...menuItemStyle,
                                    backgroundColor: activeTab === item.id ? 'rgba(255, 200, 0, 0.1)' : 'transparent',
                                    color: activeTab === item.id ? 'var(--arc-yellow)' : 'rgba(255,255,255,0.6)',
                                    borderLeft: activeTab === item.id ? '3px solid var(--arc-yellow)' : '3px solid transparent',
                                }}
                            >
                                {item.icon}
                                <span style={{ fontSize: '14px', fontWeight: activeTab === item.id ? 'bold' : 'normal' }}>{item.label}</span>
                                {activeTab === item.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                            </div>
                        ))}
                    </div>

                    <div style={sidebarFooter}>
                        <div style={profileMiniCard}>
                            <div style={avatarCircle}>O</div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={miniName}>OWNER MODE</p>
                                <p style={miniEmail}>{currentUserRole?.toUpperCase()}</p>
                            </div>
                        </div>
                        <div style={backToSiteBtn} onClick={onClose}>
                            <LogOut size={14} /> BACK TO SITE
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                <div style={contentArea}>
                    <div style={topBar}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {isMobile && (
                                <div onClick={() => setIsSidebarOpen(true)} style={{ cursor: 'pointer' }}>
                                    <Menu size={24} color="#fff" />
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>SYSTEM /</span>
                                <span style={{ color: '#fff', fontSize: '12px', letterSpacing: '1px' }}>{activeTab.toUpperCase()}</span>
                            </div>
                        </div>
                        <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} className="hover-white" />
                    </div>

                    <div style={scrollContent}>
                        {activeTab === 'dashboard' && <DashboardView />}
                        {activeTab === 'users' && <UserManagementView />}
                        {(activeTab !== 'dashboard' && activeTab !== 'users') && (
                            <div style={centeredStyle}>
                                <Database size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                <p>MODULE OFFLINE OR UNDER DEVELOPMENT</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>REF: {activeTab.toUpperCase()}_v1.0</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    zIndex: 10000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative' // For absolute positioning of mobile sidebar
};

const sidebarStyle = {
    width: '260px',
    background: '#0a0a0a',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0 // Prevent shrinking
};

const brandingArea = {
    padding: '30px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #1a1a1a'
};

const brandingText = {
    fontSize: '18px',
    fontWeight: '900',
    color: '#fff',
    letterSpacing: '2px'
};

const menuContainer = {
    padding: '20px 0',
    flex: 1
};

const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const sidebarFooter = {
    padding: '20px',
    borderTop: '1px solid #1a1a1a',
    backgroundColor: '#050505'
};

const profileMiniCard = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px'
};

const avatarCircle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff'
};

const miniName = { margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#fff' };
const miniEmail = { margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' };

const backToSiteBtn = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s'
};

const contentArea = {
    flex: 1,
    background: '#050505',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' // Ensure content scrolls properly
};

const topBar = {
    padding: '15px 30px',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0a0a0a'
};

const scrollContent = {
    flex: 1,
    overflowY: 'auto'
};

const contentPadding = {
    padding: '30px',
};

const headerSection = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
};

const viewTitle = {
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '3px',
    margin: 0,
    color: '#fff'
};

const onlineStatus = {
    fontSize: '10px',
    background: 'rgba(0, 255, 0, 0.1)',
    color: '#00ff00',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 0, 0.2)',
    fontWeight: 'bold'
};

const versionBadge = {
    fontSize: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.5)',
    padding: '4px 8px',
    borderRadius: '4px',
    marginLeft: '10px'
};

const metricsGrid = {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap' // Allow wrapping on intermediate sizes
};

const metricCard = {
    flex: 1,
    minWidth: '200px', // Prevent too small cards
    background: '#111',
    border: '1px solid #222',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
};

const metricLabel = { margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' };
const metricValue = { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#fff' };

const mainContentArea = {
    display: 'flex',
    gap: '20px'
};

const performanceCard = {
    flex: 1,
    background: '#0a0a0a',
    border: '1px solid #222',
    padding: '24px',
    borderRadius: '12px'
};

const cardTitle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' };

const progressBarContainer = { marginBottom: '20px' };
const progressBarBg = { height: '8px', background: '#111', borderRadius: '4px', overflow: 'hidden' };
const progressBarFill = { height: '100%', borderRadius: '4px' };

const searchBarContainer = {
    background: '#111',
    padding: '8px 15px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #222'
};

const searchInputStyle = {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '200px'
};

const tableWrapper = {
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '12px',
    overflow: 'hidden'
};

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.3)', padding: '15px 20px', borderBottom: '1px solid #222', letterSpacing: '1px' };
const tdStyle = { padding: '15px 20px', fontSize: '13px', borderBottom: '1px solid #111' };
const trStyle = { transition: 'background 0.2s' };
const roleBadgeStyle = { fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#fff' };
const centeredStyle = { padding: '100px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px', letterSpacing: '2px' };
const badgeRow = { display: 'flex', alignItems: 'center' };

export default AdminDashboard;

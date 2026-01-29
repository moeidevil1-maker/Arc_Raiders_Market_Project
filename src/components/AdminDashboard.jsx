import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
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
    const { t } = useLanguage();
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
                alert(t('OWNER_NO_MODIFY'));
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
                <h2 style={{ ...viewTitle, fontSize: isMobile ? '20px' : '24px' }}>{t('SYSTEM_DASHBOARD')}</h2>
                <div style={badgeRow}>
                    <span style={onlineStatus}>{t('LIVE_STATUS')}</span>
                    <span style={versionBadge}>V1.2.0-ARC</span>
                </div>
            </div>

            <div style={{ ...metricsGrid, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={metricCard}>
                    <Users size={20} color="var(--arc-cyan)" />
                    <div>
                        <p style={metricLabel}>{t('TOTAL_PLAYERS')}</p>
                        <p style={metricValue}>{users.length}</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Zap size={20} color="var(--arc-yellow)" />
                    <div>
                        <p style={metricLabel}>{t('ACTIVE_SESSIONS')}</p>
                        <p style={metricValue}>12</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Activity size={20} color="#00ff00" />
                    <div>
                        <p style={metricLabel}>{t('SYSTEM_LOAD')}</p>
                        <p style={metricValue}>1.2%</p>
                    </div>
                </div>
                <div style={metricCard}>
                    <Database size={20} color="#ff00ff" />
                    <div>
                        <p style={metricLabel}>{t('DB_LATENCY')}</p>
                        <p style={metricValue}>24ms</p>
                    </div>
                </div>
            </div>

            <div style={mainContentArea}>
                <div style={performanceCard}>
                    <h3 style={cardTitle}>{t('PERFORMANCE_METRICS')}</h3>
                    <div style={progressBarContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>{t('PAGE_LOAD_TIME')}</span>
                            <span style={{ color: '#00ff00' }}>482ms</span>
                        </div>
                        <div style={progressBarBg}><div style={{ ...progressBarFill, width: '35%', background: '#00ff00' }}></div></div>
                    </div>
                    <div style={progressBarContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>{t('API_RESPONSE')}</span>
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
                <h2 style={{ ...viewTitle, fontSize: isMobile ? '20px' : '24px' }}>{t('USER_MANAGEMENT')}</h2>
                <div style={{ ...searchBarContainer, width: isMobile ? '100%' : 'auto' }}>
                    <Search size={18} color="rgba(255,255,255,0.4)" />
                    <input
                        type="text"
                        placeholder={t('SEARCH_EMAIL')}
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
                    <div style={centeredStyle}>{t('INIT_ENCRYPTED')}</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ ...tableStyle, minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>{t('EMAIL_IDENTITY')}</th>
                                    <th style={thStyle}>{t('CREDITS')}</th>
                                    <th style={thStyle}>{t('CLEARANCE')}</th>
                                    <th style={thStyle}>{t('ACTIONS')}</th>
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
                                                            {isUpdating === user.id ? '...' : (user.role?.toLowerCase() === 'admin' ? t('DEMOTE') : t('MAKE_ADMIN'))}
                                                        </ArcButton>
                                                        <ArcButton
                                                            color="blue"
                                                            style={{ padding: '4px 0', fontSize: '10px', width: '85px', justifyContent: 'center' }}
                                                            onClick={() => onLoginAs(user)}
                                                        >
                                                            {t('LOGIN_AS')}
                                                        </ArcButton>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}><Lock size={12} style={{ marginRight: '4px' }} /> {t('LOCKED')}</span>
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
        { id: 'dashboard', label: t('SYSTEM_DASHBOARD'), icon: <LayoutDashboard size={18} /> },
        { id: 'users', label: t('USER_MANAGEMENT'), icon: <Users size={18} /> },
        { id: 'health', label: t('HEALTH'), icon: <Activity size={18} /> },
        { id: 'logs', label: t('LOGS'), icon: <FileText size={18} /> },
        { id: 'settings', label: t('SETTINGS'), icon: <Settings size={18} /> },
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
                        <span style={brandingText}>{t('SYSTEM_CONTROL')}</span>
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
                                <p style={miniName}>{t('GOD_MODE')}</p>
                                <p style={miniEmail}>{currentUserRole?.toUpperCase()}</p>
                            </div>
                        </div>
                        <div style={backToSiteBtn} onClick={onClose}>
                            <LogOut size={14} /> {t('BACK_TO_SITE')}
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
                        {activeTab === 'users' && <UserManagementView />}
                        {activeTab === 'settings' && <SettingsView />}
                        {activeTab === 'logs' && <AccessLogsView />}
                        {(activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'settings' && activeTab !== 'logs') && (
                            <div style={centeredStyle}>
                                <Database size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                <p>{t('NO_DATA')}</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>REF: {activeTab.toUpperCase()}_v1.0</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ACCESS LOGS VIEW ---
const AccessLogsView = () => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('ALL'); // ALL, INFO, WARN, ERROR

    // Mock Data for Logs
    const MOCK_LOGS = [
        { id: 'L-1024', time: '10:42:15', date: '2026-01-29', level: 'INFO', user: 'admin@arc.th', action: 'SYSTEM_LOGIN', details: 'Successful login from IP 192.168.1.1' },
        { id: 'L-1023', time: '10:40:00', date: '2026-01-29', level: 'WARN', user: 'SYSTEM', action: 'HIGH_LATENCY', details: 'Database response time > 500ms' },
        { id: 'L-1022', time: '10:35:22', date: '2026-01-29', level: 'INFO', user: 'player1@gmail.com', action: 'USER_REGISTER', details: 'New account created' },
        { id: 'L-1021', time: '10:15:10', date: '2026-01-29', level: 'ERROR', user: 'unknown', action: 'AUTH_FAILURE', details: 'Failed login attempt (3x) from IP 45.2.1.99' },
        { id: 'L-1020', time: '09:55:01', date: '2026-01-29', level: 'INFO', user: 'SYSTEM', action: 'CRON_JOB', details: 'Daily backup completed successfully' },
        { id: 'L-1019', time: '09:30:45', date: '2026-01-29', level: 'CRITICAL', user: 'SYSTEM', action: 'ECONOMY_ALERT', details: 'Abnormal credit distribution detected in Sector 4' },
        { id: 'L-1018', time: '09:00:00', date: '2026-01-29', level: 'INFO', user: 'moderator@arc.th', action: 'ROLE_UPDATE', details: 'Changed role for user ID #8821 to USER' },
        { id: 'L-1017', time: '08:45:12', date: '2026-01-29', level: 'INFO', user: 'player2@hotmail.com', action: 'TRANSACTION', details: 'Purchased mock_item_22 for 500 credits' },
    ];

    const getLevelColor = (level) => {
        switch (level) {
            case 'INFO': return 'var(--arc-cyan)';
            case 'WARN': return 'var(--arc-yellow)';
            case 'ERROR': return '#ff4444';
            case 'CRITICAL': return '#ff00ff'; // Neon pink for critical
            default: return '#fff';
        }
    };

    const filteredLogs = MOCK_LOGS.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    return (
        <div style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '2px', color: '#fff', margin: 0 }}>
                    {t('ACCESS_LOGS')} // SECURITY AUDIT
                </h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        style={{
                            background: '#111',
                            color: '#fff',
                            border: '1px solid #333',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            outline: 'none',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="ALL">ALL LEVELS</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARNING</option>
                        <option value="ERROR">ERROR/CRITICAL</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                        <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                padding: '8px 10px 8px 30px',
                                color: '#fff',
                                fontSize: '12px',
                                outline: 'none',
                                width: '200px'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Logs Terminal/Table */}
            <div style={{
                flex: 1,
                background: '#080808',
                border: '1px solid #222',
                borderRadius: '8px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#080808', zIndex: 1 }}>
                        <tr style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid #222', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>TIMESTAMP</th>
                            <th style={{ padding: '10px' }}>LEVEL</th>
                            <th style={{ padding: '10px' }}>SOURCE/USER</th>
                            <th style={{ padding: '10px' }}>EVENT</th>
                            <th style={{ padding: '10px' }}>DETAILS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #111', transition: 'background 0.2s' }} className="log-row">
                                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)' }}>
                                    {log.date} <span style={{ color: '#fff' }}>{log.time}</span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        color: getLevelColor(log.level),
                                        border: `1px solid ${getLevelColor(log.level)}`,
                                        padding: '2px 6px',
                                        borderRadius: '2px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {log.level}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', color: '#ddd' }}>{log.user}</td>
                                <td style={{ padding: '10px', color: 'var(--arc-yellow)' }}>{log.action}</td>
                                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.7)' }}>{log.details}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    NO ENTRY FOUND
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .log-row:hover {
                    background: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    );
};
// --- END ACCESS LOGS VIEW ---

// --- SETTINGS VIEW ---
const SettingsView = () => {
    const { t } = useLanguage();
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowSignups: true,
        transactionFee: 5,
        startingCredits: 1000,
        announcement: '',
        discordUrl: 'https://discord.gg/arcraiders',
        facebookUrl: 'https://facebook.com/arcraiders'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert('CONFIRMATION: System parameters updated successfully.');
        }, 1500);
    };

    return (
        <div style={{ padding: '30px', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '2px', color: '#fff', margin: 0 }}>
                    {t('SETTINGS')} // SYSTEM PARAMETERS
                </h2>
                <ArcButton onClick={handleSave} color="yellow" disabled={isSaving} style={{ minWidth: '120px', justifyContent: 'center' }}>
                    {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </ArcButton>
            </div>

            {/* Global System Protocol */}
            <div style={settingsSectionStyle}>
                <h3 style={sectionHeaderStyle}>
                    <Shield size={18} color="var(--arc-cyan)" />
                    GLOBAL SYSTEM PROTOCOL
                </h3>
                <div style={settingRowStyle}>
                    <div>
                        <p style={settingLabelStyle}>MAINTENANCE MODE</p>
                        <p style={settingDescStyle}>Lock system access for non-admin personnel.</p>
                    </div>
                    <label style={toggleSwitchStyle}>
                        <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                        />
                        <span style={sliderStyle}></span>
                    </label>
                </div>
                <div style={settingRowStyle}>
                    <div>
                        <p style={settingLabelStyle}>ALLOW NEW REGISTRATIONS</p>
                        <p style={settingDescStyle}>Open/Close gateway for new operatives.</p>
                    </div>
                    <label style={toggleSwitchStyle}>
                        <input
                            type="checkbox"
                            checked={settings.allowSignups}
                            onChange={e => setSettings({ ...settings, allowSignups: e.target.checked })}
                        />
                        <span style={sliderStyle}></span>
                    </label>
                </div>
            </div>

            {/* Economy Parameters */}
            <div style={settingsSectionStyle}>
                <h3 style={sectionHeaderStyle}>
                    <Database size={18} color="var(--arc-yellow)" />
                    ECONOMY PARAMETERS
                </h3>
                <div style={inputGroupStyle}>
                    <label style={inputLabelStyle}>TRANSACTION FEE (%)</label>
                    <input
                        type="number"
                        value={settings.transactionFee}
                        onChange={e => setSettings({ ...settings, transactionFee: e.target.value })}
                        style={inputFieldStyle}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={inputLabelStyle}>DEFAULT STARTING CREDITS</label>
                    <input
                        type="number"
                        value={settings.startingCredits}
                        onChange={e => setSettings({ ...settings, startingCredits: e.target.value })}
                        style={inputFieldStyle}
                    />
                </div>
            </div>

            {/* Communication Matrix */}
            <div style={settingsSectionStyle}>
                <h3 style={sectionHeaderStyle}>
                    <Activity size={18} color="#00ff00" />
                    COMMUNICATION MATRIX
                </h3>
                <div style={inputGroupStyle}>
                    <label style={inputLabelStyle}>SYSTEM ANNOUNCEMENT (HEADER)</label>
                    <input
                        type="text"
                        placeholder="Enter system-wide message..."
                        value={settings.announcement}
                        onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                        style={inputFieldStyle}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={inputLabelStyle}>DISCORD UPLINK</label>
                    <input
                        type="text"
                        value={settings.discordUrl}
                        onChange={e => setSettings({ ...settings, discordUrl: e.target.value })}
                        style={inputFieldStyle}
                    />
                </div>
            </div>

            {/* CSS Injection for Toggle Switch */}
            <style>{`
                input:checked + span {
                    background-color: var(--arc-yellow);
                }
                input:focus + span {
                    box-shadow: 0 0 1px var(--arc-yellow);
                }
                input:checked + span:before {
                    -webkit-transform: translateX(18px);
                    -ms-transform: translateX(18px);
                    transform: translateX(18px);
                    background-color: #000;
                }
                span:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    -webkit-transition: .4s;
                    transition: .4s;
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
};

// Settings Styles
const settingsSectionStyle = {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
};

const sectionHeaderStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #222',
    paddingBottom: '15px',
    letterSpacing: '1px'
};

const settingRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
};

const settingLabelStyle = { margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#fff' };
const settingDescStyle = { margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' };

const inputGroupStyle = { marginBottom: '15px' };
const inputLabelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' };
const inputFieldStyle = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '10px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
};

// Toggle Switch CSS-in-JS
const toggleSwitchStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '22px'
};

const sliderStyle = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#333',
    transition: '.4s',
    borderRadius: '22px'
};
// Note: Pseudo-elements for toggle slider (::before) can't be done easily in inline styles without a style tag or emotion/styled-components.
// Using a simpler simulated toggle approach with border color or just rendering a customized check box for simplicity in inline styles might be tricky,
// but let's try to inject a small style tag for the toggle interactions solely for this component.

/* Additional Global Styles for this component which need to be injected or handled via classNames */

// --- END SETTINGS VIEW ---

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

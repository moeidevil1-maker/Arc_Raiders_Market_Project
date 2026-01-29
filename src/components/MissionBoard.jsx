import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    Filter,
    MessageSquare,
    X,
    Clock,
    User,
    ChevronRight,
    Tag,
    DollarSign,
    Briefcase,
    LogIn,
    Trash2
} from 'lucide-react';
import ArcButton from './ArcButton';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'leveling', label: 'เก็บเลเวล' },
    { id: 'farming', label: 'ฟาร์มของ' },
    { id: 'other', label: 'อื่นๆ' }
];

const TYPES = [
    { id: 'all', label: 'ทั้งหมด', color: '#fff' },
    { id: 'service', label: 'รับจ้าง/บริการ', color: '#fcc419' },
    { id: 'request', label: 'ประกาศหา/จ้าง', color: '#00ffff' }
];

const MissionBoard = ({ currentUser, onContact }) => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // 4 columns x 2 rows

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMission, setSelectedMission] = useState(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Form states
    const [newMission, setNewMission] = useState({
        type: 'service',
        category: 'leveling',
        title: '',
        price: '',
        description: ''
    });

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            console.log('Fetching missions (Robust Mode)...');

            // 1. Fetch RAW Missions first (No Joins) - safest reliable method
            const { data: rawMissions, error: rawError } = await supabase
                .from('missions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (rawError) {
                console.error('Core mission fetch failed:', rawError);
                throw rawError;
            }

            console.log('Raw missions fetched:', rawMissions?.length || 0);

            if (!rawMissions || rawMissions.length === 0) {
                setMissions([]);
                setLoading(false);
                return;
            }

            // 2. Extract User IDs to fetch profiles manually
            const userIds = [...new Set(rawMissions.map(m => m.user_id).filter(id => id))];

            // 3. Fetch Profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, role, avatar_url')
                .in('id', userIds);

            if (profileError) {
                console.warn('Profile fetch warning:', profileError);
            }

            // 4. Map Data
            const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const mappedMissions = rawMissions.map(m => {
                const profile = profileMap[m.user_id];
                return {
                    ...m,
                    user: {
                        id: m.user_id,
                        name: profile?.email?.split('@')[0] || 'Unknown Raider',
                        avatar: profile?.avatar_url || null,
                        role: profile?.role || 'user'
                    }
                };
            });

            console.log('Final mapped missions:', mappedMissions.length);
            setMissions(mappedMissions);

        } catch (error) {
            console.error('Error fetching missions:', error);
            // alert('ไม่สามารถดึงข้อมูลประกาศได้: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMission = async () => {
        if (!newMission.title || !newMission.description) return;

        try {
            const missionData = {
                user_id: currentUser.id,
                type: newMission.type,
                category: newMission.category,
                title: newMission.title,
                price: newMission.price ? parseFloat(newMission.price) : null,
                description: newMission.description,
                status: 'active'
            };

            const { data, error } = await supabase
                .from('missions')
                .insert([missionData])
                .select()
                .single();

            if (error) throw error;

            // Refresh the board
            fetchMissions();

            setIsCreateModalOpen(false);
            setNewMission({
                type: 'service',
                category: 'farming',
                title: '',
                price: '',
                description: ''
            });

        } catch (error) {
            console.error('Error creating mission:', error);
            alert('เกิดข้อผิดพลาดในการสร้างประกาศ: ' + error.message);
        }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInHours < 1) return 'เมื่อครู่';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return `${Math.floor(diffInHours / 24)} day ago`;
    };

    const handleDeleteMission = async (missionId) => {

        try {
            // Check if it's a real DB record (usually UUID) or local mock (Number)
            const isMockId = typeof missionId === 'number';

            if (!isMockId) {
                const { error } = await supabase.from('missions').delete().eq('id', missionId);
                if (error) throw error;
            }

            setMissions(prev => {
                const nextMissions = prev.filter(m => m.id !== missionId);
                // Adjust pagination if we're on a page that no longer exists
                const newTotalPages = Math.ceil(nextMissions.length / itemsPerPage);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
                return nextMissions;
            });

            setSelectedMission(null);
            setIsConfirmingDelete(false);
        } catch (error) {
            console.error('Error deleting mission:', error.message);
            alert('ลบประกาศไม่สำเร็จ: ' + error.message);
        }
    };

    const filteredMissions = missions.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
    const paginatedMissions = filteredMissions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterType, filterCategory]);

    return (
        <section style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>MISSION BOARD</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>ศูนย์รวมบริการ รับจ้าง ฟาร์มของ และประกาศหาไอเทมสำหรับ Raiders</p>
                </div>
                <ArcButton
                    color={currentUser ? "yellow" : "cyan"}
                    onClick={async () => {
                        if (!currentUser) {
                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: window.location.origin
                                }
                            });
                            return;
                        }
                        setIsCreateModalOpen(true);
                    }}
                >
                    {currentUser ? (
                        <><Plus size={18} style={{ marginRight: '8px' }} /> แปะประกาศใหม่</>
                    ) : (
                        <><LogIn size={18} style={{ marginRight: '8px' }} /> เข้าสู่ระบบเพื่อแปะประกาศ</>
                    )}
                </ArcButton>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', padding: '4px' }}>
                    {TYPES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilterType(t.id)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '30px',
                                border: 'none',
                                background: filterType === t.id ? '#fff' : 'transparent',
                                color: filterType === t.id ? '#000' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }}></div>
                            {t.label}
                        </button>
                    ))}
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0 15px',
                        cursor: 'pointer'
                    }}
                >
                    {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                </select>

                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="ค้นหาประกาศ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '30px',
                            color: '#fff',
                            padding: '12px 15px 12px 45px',
                            outline: 'none focus:border-cyan'
                        }}
                    />
                </div>
            </div>

            {/* Mission Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Increased min-width for larger cards
                gridTemplateRows: 'repeat(2, auto)',
                gap: '25px',
                // On large screens, force 4 columns
                ...(window.innerWidth > 1200 ? { gridTemplateColumns: 'repeat(4, 1fr)' } : {})
            }}>
                {paginatedMissions.map(m => (
                    <motion.div
                        key={m.id}
                        layout
                        whileHover={{
                            y: -8,
                            borderColor: m.type === 'service' ? 'rgba(252, 196, 25, 0.6)' : 'rgba(0, 255, 255, 0.6)',
                            boxShadow: m.type === 'service' ? '0 10px 30px rgba(252, 196, 25, 0.15)' : '0 10px 30px rgba(0, 255, 255, 0.15)'
                        }}
                        onClick={() => setSelectedMission(m)}
                        style={{
                            background: '#fff',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '220px',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {/* Glow Accent Top */}
                        <div style={{
                            height: '4px',
                            width: '100%',
                            background: m.type === 'service' ? '#fcc419' : '#00ffff'
                        }}></div>

                        <div style={{ padding: '24px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    letterSpacing: '1.5px',
                                    color: m.type === 'service' ? '#fcc419' : '#00ffff',
                                    textTransform: 'uppercase',
                                    background: m.type === 'service' ? 'rgba(252, 196, 25, 0.1)' : 'rgba(0, 255, 255, 0.1)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    border: `1px solid ${m.type === 'service' ? 'rgba(252, 196, 25, 0.2)' : 'rgba(0, 255, 255, 0.2)'}`
                                }}>
                                    {m.type === 'service' ? 'SERVICE PROVIDER' : 'MISSION REQUEST'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={12} /> {getTimeAgo(m.created_at)}
                                </div>
                            </div>

                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '800',
                                color: '#000',
                                marginBottom: '12px',
                                lineHeight: '1.4',
                                letterSpacing: '0.5px'
                            }}>
                                {m.title}
                            </h3>
                            <p style={{
                                fontSize: '13px',
                                color: '#333',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.6',
                                fontWeight: '500'
                            }}>
                                {m.description}
                            </p>
                        </div>

                        {/* Footer - Integrated Tech Look */}
                        <div style={{
                            padding: '16px 24px',
                            background: '#f8f9fa', // Light gray background for footer
                            borderTop: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#e9ecef',
                                    border: '1px solid #dee2e6',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {m.user.avatar ? (
                                        <img src={m.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={16} style={{ color: '#adb5bd' }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 'bold' }}>{m.user.name}</span>
                                    <span style={{ fontSize: '10px', color: '#6c757d', letterSpacing: '0.5px' }}>RAIDER POSTER</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    color: m.type === 'service' ? '#d9480f' : '#087f5b', // Darker, more readable colors for white BG
                                    fontWeight: '900',
                                    fontSize: '18px'
                                }}>
                                    {m.price ? `${Number(m.price).toLocaleString()} ฿` : 'OFFER'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '40px',
                    padding: '20px'
                }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ก่อนหน้า
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    borderColor: currentPage === i + 1 ? 'var(--arc-yellow)' : 'rgba(255,255,255,0.1)',
                                    background: currentPage === i + 1 ? 'rgba(252, 196, 25, 0.1)' : 'transparent',
                                    color: currentPage === i + 1 ? 'var(--arc-yellow)' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ถัดไป
                    </button>
                </div>
            )}

            {/* Create Mission Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#1a1a1a',
                                width: '100%',
                                maxWidth: '600px',
                                borderRadius: '16px',
                                zIndex: 1,
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>สร้างประกาศใหม่</h1>
                                <X size={24} style={{ cursor: 'pointer' }} onClick={() => setIsCreateModalOpen(false)} />
                            </div>

                            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>ประเภท</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {TYPES.filter(t => t.id !== 'all').map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setNewMission({ ...newMission, type: t.id })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid',
                                                        borderColor: newMission.type === t.id ? t.color : 'rgba(255,255,255,0.1)',
                                                        background: newMission.type === t.id ? `${t.color}22` : 'transparent',
                                                        color: t.color,
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>หมวดหมู่</label>
                                        <select
                                            value={newMission.category}
                                            onChange={(e) => setNewMission({ ...newMission, category: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        >
                                            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>หัวข้อประกาศ</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น รับฟาร์มของทำโต๊ะ"
                                        value={newMission.title}
                                        onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>ราคา/งบประมาณ (บาท)</label>
                                    <input
                                        type="number"
                                        placeholder="ปล่อยว่างหากเป็นข้อเสนอ"
                                        value={newMission.price}
                                        onChange={(e) => setNewMission({ ...newMission, price: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>รายละเอียด</label>
                                    <textarea
                                        rows={4}
                                        placeholder="ระบุรายละเอียดบริการ หรือสิ่งที่ต้องการจ้าง..."
                                        value={newMission.description}
                                        onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            resize: 'none'
                                        }}
                                    />
                                </div>

                                <ArcButton
                                    color="yellow"
                                    onClick={handleCreateMission}
                                    style={{ width: '100%', padding: '15px' }}
                                >
                                    ยืนยันการโพสต์
                                </ArcButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mission Detail Modal */}
            <AnimatePresence>
                {selectedMission && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedMission(null);
                                setIsConfirmingDelete(false);
                            }}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#1a1a1a',
                                width: '100%',
                                maxWidth: '700px',
                                borderRadius: '16px',
                                zIndex: 1,
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>รายละเอียดภารกิจ</h1>
                                <X size={24} style={{ cursor: 'pointer' }} onClick={() => {
                                    setSelectedMission(null);
                                    setIsConfirmingDelete(false);
                                }} />
                            </div>

                            <div style={{ padding: '30px' }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <span style={{
                                        background: 'rgba(252, 196, 25, 0.1)',
                                        color: '#fcc419',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {CATEGORIES.find(c => c.id === selectedMission.category)?.label}
                                    </span>
                                </div>

                                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '25px' }}>{selectedMission.title}</h2>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                                            {selectedMission.user.avatar ? (
                                                <img src={selectedMission.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={30} style={{ margin: '10px', opacity: 0.3 }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{selectedMission.user.name}</div>
                                            <div style={{ fontSize: '12px', opacity: 0.5 }}>โพสต์เมื่อ: {selectedMission.created_at.split('T')[0]}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.5 }}>ค่าจ้าง/ราคา</div>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fcc419' }}>
                                            {selectedMission.price ? `${selectedMission.price.toLocaleString()}` : 'ยังไม่ระบุ'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '25px',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    color: 'rgba(255,255,255,0.8)',
                                    marginBottom: '30px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {selectedMission.description}
                                </div>

                                {currentUser && currentUser.id === selectedMission.user?.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                        {!isConfirmingDelete ? (
                                            <ArcButton
                                                color="red"
                                                onClick={() => setIsConfirmingDelete(true)}
                                                style={{ width: '100%', padding: '20px', fontSize: '18px' }}
                                            >
                                                <Trash2 size={20} style={{ marginRight: '10px' }} /> ลบประกาศของคุณ
                                            </ArcButton>
                                        ) : (
                                            <div style={{
                                                background: 'rgba(255, 0, 0, 0.1)',
                                                padding: '20px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{ color: '#ff4444', marginBottom: '15px', fontWeight: 'bold' }}>ยืนยันว่าต้องการลบประกาศนี้?</p>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <ArcButton
                                                        color="red"
                                                        onClick={() => handleDeleteMission(selectedMission.id)}
                                                        style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                                    >
                                                        ใช่, ลบเลย
                                                    </ArcButton>
                                                    <ArcButton
                                                        color="gray"
                                                        onClick={() => setIsConfirmingDelete(false)}
                                                        style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                                    >
                                                        ยกเลิก
                                                    </ArcButton>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : currentUser ? (
                                    <ArcButton
                                        color="blue"
                                        onClick={() => {
                                            onContact(selectedMission);
                                            setSelectedMission(null);
                                            setIsConfirmingDelete(false);
                                        }}
                                        style={{ width: '100%', padding: '20px', fontSize: '18px' }}
                                    >
                                        <MessageSquare size={20} style={{ marginRight: '10px' }} /> ติดต่อผู้ประกาศ
                                    </ArcButton>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default MissionBoard;

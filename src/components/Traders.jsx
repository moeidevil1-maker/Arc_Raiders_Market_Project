import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Info, TrendingUp, Shield, Zap, ChevronRight, Clock, Triangle, Coins } from 'lucide-react';
import ArcButton from './ArcButton';

const tradersData = [
    {
        id: 'apollo',
        name: 'APOLLO',
        title: 'THE CORE SPECIALIST',
        description: 'Apollo specializes in high-energy cores and electronic components. If you need to power up your gear or find rare tech scavenged from the ARC, he is your man. His connections with the underground tech-runners are legendary.',
        avatar: null
    },
    {
        id: 'celeste',
        name: 'CELESTE',
        title: 'THE SURVIVALIST',
        description: 'A former field medic who now trades in medical supplies and survival gear. Celeste knows the surface better than anyone. Her goods are expensive, but they are often the difference between life and death in the ruins.',
        avatar: null // ใส่ Path รูปในอนาคต เช่น '/assets/traders/celeste_avatar.png'
    },
    {
        id: 'lance',
        name: 'LANCE',
        title: 'THE ARMS DEALER',
        description: 'Lance lives for the sound of gunfire. He deals exclusively in weaponry and ammunition. From refurbished old-world rifles to experimental ARC-tech blasters, Lance has the firepower you need for your next raid.',
        avatar: null // ใส่ Path รูปในอนาคต เช่น '/assets/traders/lance_avatar.png'
    },
    {
        id: 'shani',
        name: 'SHANI',
        title: 'THE SCRAP QUEEN',
        description: 'If it can be recycled, Shani has it. She manages the largest scrap yard in the colony. Her inventory is vast and messy, but if you have the patience to dig through it, you can find incredible bargains on raw materials.',
        avatar: null // ใส่ Path รูปในอนาคต เช่น '/assets/traders/shani_avatar.png'
    },
    {
        id: 'tianwen',
        name: 'TIANWEN',
        title: 'THE ARCHIVIST',
        description: 'Tianwen is interested in the pre-ARC world. He trades in old-world artifacts and data drives. To most, it is junk, but to the Archivist, it is the key to understanding how the world ended—and how to fix it.',
        avatar: null // ใส่ Path รูปในอนาคต เช่น '/assets/traders/tianwen_avatar.png'
    }
];

// ฟังก์ชันสำหรับดึงสีตามระดับความหายากของไอเทม
const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
        case 'legendary': return '#ff8000'; // สีส้มสำหรับ Legendary
        case 'epic': return '#a335ee';      // สีม่วงสำหรับ Epic
        case 'rare': return '#0070dd';      // สีน้ำเงินสำหรับ Rare
        case 'uncommon': return '#1eff00';  // สีเขียวสำหรับ Uncommon
        case 'common': return '#ffffff';    // สีขาวสำหรับ Common
        default: return '#ffffff';
    }
};

// คอมโพเนนต์แสดง Tooltip ข้อมูลไอเทมแบบละเอียด
const Tooltip = ({ item, details, position }) => {
    if (!item) return null;

    const stats = details?.stat_block || {};
    const flavorText = details?.flavor_text;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: 'fixed',
                left: position.x + 20,
                top: position.y - 20,
                width: '320px',
                background: 'rgba(10, 10, 10, 0.95)',
                border: `1px solid ${getRarityColor(item.rarity)}`,
                borderRadius: '8px',
                padding: '20px',
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 15px ${getRarityColor(item.rarity)}33`
            }}
        >
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '5px' }}>
                    <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: getRarityColor(item.rarity), fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '2px' }}>{item.item_type}</span>
                        <span style={{ fontSize: '10px', color: getRarityColor(item.rarity), fontWeight: 'bold' }}>{item.rarity?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', marginBottom: '15px' }}>
                {item.description}
            </div>

            {details ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    {Object.entries(stats).map(([key, value]) => {
                        if (value === 0 || value === null || typeof value === 'object') return null;
                        return (
                            <div key={key} style={{ fontSize: '11px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}: </span>
                                <span style={{ color: 'var(--arc-cyan)' }}>{value}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '15px', fontStyle: 'italic' }}>Loading technical data...</div>
            )}

            {flavorText && (
                <div style={{ fontSize: '11px', color: 'var(--arc-yellow)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                    {flavorText}
                </div>
            )}

            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: 'var(--arc-yellow)', fontSize: '14px', fontWeight: 'bold' }}>{item.trader_price || item.value} CR</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>WEIGHT: {stats.weight || '0.0'}</div>
            </div>
        </motion.div>
    );
};

const Traders = () => {
    // การจัดการ State ต่างๆ ในหน้า Traders
    const [activeTrader, setActiveTrader] = useState(tradersData[0]); // เก็บข้อมูล Trader ที่กำลังเลือกอยู่
    const [inventories, setInventories] = useState({});               // เก็บข้อมูลไอเทมทั้งหมดจาก API
    const [loading, setLoading] = useState(true);                     // สถานะการโหลดข้อมูล
    const [hoveredItem, setHoveredItem] = useState(null);             // ไอเทมที่เมาส์กำลังวางอยู่ (สำหรับ Tooltip)
    const [itemDetails, setItemDetails] = useState({});               // เก็บรายละเอียดเฉพาะของแต่ละไอเทม (Stat Block)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // ตำแหน่งเมาส์

    // ดึงข้อมูลไอเทมจาก API เมื่อโหลดหน้าเว็บครั้งแรก
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // เรียก API ผ่าน Proxy ที่ตั้งค่าไว้ใน vite.config.js เพื่อเลี่ยง CORS
                const response = await fetch('/api/metaforge/traders');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();

                if (data.success && data.data) {
                    setInventories(data.data); // บันทึกข้อมูลไอเทมลงใน State
                } else {
                    console.error('API success was false or data missing:', data);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const traderIdToKey = {
        'apollo': 'Apollo',
        'celeste': 'Celeste',
        'lance': 'Lance',
        'shani': 'Shani',
        'tianwen': 'TianWen'
    };

    // Try to get inventory using specific key mapping, then fallback to case-insensitive match
    const getInventoryForTrader = (traderId) => {
        const specificKey = traderIdToKey[traderId];
        if (inventories[specificKey]) return inventories[specificKey];

        // Fallback: search for key regardless of case
        const foundKey = Object.keys(inventories).find(k => k.toLowerCase() === traderId.toLowerCase());
        return foundKey ? inventories[foundKey] : [];
    };

    const currentInventory = getInventoryForTrader(activeTrader.id);

    // ฟังก์ชันจัดการเมื่อนำเมาส์ไปวางบนไอเทม (แสดง Tooltip และดึงข้อมูล Stat ลึกๆ)
    const handleMouseEnter = async (item, e) => {
        setHoveredItem(item);
        setMousePosition({ x: e.clientX, y: e.clientY });

        // ถ้ายังไม่มีข้อมูลรายละเอียดไอเทมใน State ให้ดึงจาก API
        if (!itemDetails[item.id]) {
            try {
                const response = await fetch(`/api/metaforge/items?id=${item.id}`);
                const data = await response.json();
                if (data.data && data.data[0]) {
                    // เก็บข้อมูลรายละเอียดไอเทมลงใน State เพื่อไม่ต้องดึงซ้ำ
                    setItemDetails(prev => ({ ...prev, [item.id]: data.data[0] }));
                }
            } catch (error) {
                console.error('Error fetching item details:', error);
            }
        }
    };

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    return (
        <div className="traders-page" style={{
            minHeight: '100vh',
            background: '#050505',
            paddingTop: '80px', // Header height
            color: '#fff',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Container for the 3 columns */}
            {/* Container for the 3 columns - NOW CENTERED */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '100px 320px 600px',
                justifyContent: 'center',
                alignItems: 'stretch', // Ensure columns are same height
                minHeight: '600px', // Minimum height for the UI
                margin: '20px auto', // Vertical margin
                overflow: 'hidden',
                width: '100%'
            }} className="traders-grid">

                {/* Left Column: Trader Icons Only */}
                <div style={{
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '20px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        fontSize: '9px',
                        letterSpacing: '1px',
                        color: 'var(--arc-cyan)',
                        marginBottom: '5px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>AVAILABLE TRADERS</div>

                    {tradersData.map((trader) => (
                        <motion.div
                            key={trader.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTrader(trader)}
                            style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '50%',
                                background: activeTrader.id === trader.id ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255,255,255, 0.03)',
                                border: '1px solid',
                                borderColor: activeTrader.id === trader.id ? 'var(--arc-cyan)' : 'rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden', // Add this to clip the image to circle
                                boxShadow: activeTrader.id === trader.id ? '0 0 15px rgba(0,255,255,0.2)' : 'none'
                            }}
                        >
                            {trader.avatar ? (
                                <img
                                    src={trader.avatar}
                                    alt={trader.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: activeTrader.id === trader.id ? 1 : 0.6,
                                        transition: 'opacity 0.2s ease'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: activeTrader.id === trader.id ? 'var(--arc-cyan)' : 'rgba(255,255,255,0.4)',
                                }}>
                                    {trader.name[0]}
                                </div>
                            )}

                            {/* Selected Indicator */}
                            {activeTrader.id === trader.id && (
                                <motion.div
                                    layoutId="trader-active"
                                    style={{
                                        position: 'absolute',
                                        left: '-10px',
                                        width: '4px',
                                        height: '24px',
                                        background: 'var(--arc-cyan)',
                                        borderRadius: '0 2px 2px 0',
                                        boxShadow: '0 0 10px var(--arc-cyan)'
                                    }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Middle Column: Visuals & Lore */}
                <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end', // Align to bottom
                    padding: '25px 40px' // Synchronized padding
                }}>
                    {/* Video Background */}
                    <AnimatePresence mode="wait">
                        <motion.video
                            key={activeTrader.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            src={activeTrader.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                zIndex: -1
                            }}
                        />
                    </AnimatePresence>

                    {/* Grainy/Scanline Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%, rgba(0,0,0,0.4) 100%)',
                        zIndex: 0
                    }}></div>

                    {/* Lore Content */}
                    <motion.div
                        key={`info-${activeTrader.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}
                    >
                        <h1 style={{
                            letterSpacing: '5px',
                            textShadow: '0 0 20px rgba(0,255,255,0.5)',
                            fontSize: '32px'
                        }}>{activeTrader.name}</h1>
                        <h3 style={{
                            fontSize: '18px',
                            color: 'var(--arc-yellow)',
                            letterSpacing: '2px',
                            marginBottom: '20px'
                        }}>{activeTrader.title}</h3>
                        <p style={{
                            fontSize: '15px',
                            lineHeight: '1.6',
                            color: 'rgba(255,255,255,0.8)',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '20px',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--arc-cyan)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            {activeTrader.description}
                        </p>
                    </motion.div>
                </div>

                {/* Right Column: Inventory */}
                <div style={{
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '25px', // Consistent padding
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--arc-yellow)' }}>WAREHOUSE STOCK</h2>
                        </div>

                        {/* Scrollable container limited to roughly 4 rows */}
                        <div style={{
                            maxHeight: '460px', // Roughly 4 rows high + gaps
                            overflowY: 'auto',
                            paddingRight: '4px',
                            marginRight: '-4px'
                        }} className="inventory-scroll-container">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px'
                            }} className="inventory-grid">
                                {loading ? (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            style={{ marginBottom: '10px' }}
                                        >
                                            <TrendingUp size={24} />
                                        </motion.div>
                                        SYNCHRONIZING WITH WAREHOUSE...
                                    </div>
                                ) : currentInventory.length > 0 ? (
                                    // แสดงรายการไอเทมในรูปแบบการ์ดแบบพรีเมียม (ตามดีไซน์ใหม่)
                                    currentInventory.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            onMouseEnter={(e) => handleMouseEnter(item, e)}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            style={{
                                                background: 'rgba(15, 18, 22, 0.8)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                borderRadius: '2px',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                aspectRatio: '1/1',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                            }}
                                        >
                                            {/* เส้นสีบ่งบอกความหายากด้านซ้าย (Rarity Border) */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '6px',
                                                left: 0,
                                                width: '3px',
                                                height: 'calc(100% - 12px)',
                                                background: getRarityColor(item.rarity),
                                                borderRadius: '0 2px 2px 0',
                                                zIndex: 2
                                            }}></div>

                                            {/* ไอคอนนาฬิกาเล็กๆ มุมขวาบน */}
                                            {/* <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            opacity: 0.4,
                                            zIndex: 1
                                        }}>
                                            <Clock size={14} />
                                        </div> */}

                                            {/* พื้นที่แสดงรูปไอเทม (Centered) */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '12px' // Increased image padding to make item look smaller
                                            }}>
                                                <div style={{
                                                    width: '80%',
                                                    height: '80%',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <img
                                                        src={item.icon}
                                                        alt={item.name}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            objectFit: 'contain',
                                                            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* แถบข้อมูลด้านล่าง (Footer) - แสดงเฉพาะถ้ามีราคา */}
                                            {(item.trader_price || item.value) && (
                                                <div style={{
                                                    height: '22px',
                                                    background: 'rgba(0, 0, 0, 0.4)',
                                                    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0 5px',
                                                    zIndex: 2,
                                                    marginTop: 'auto'
                                                }}>
                                                    {/* ส่วนจำนวน/สต็อก */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Triangle size={7} fill="rgba(255,255,255,0.6)" stroke="none" />
                                                        <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>
                                                            {item.stock || '2'}/2
                                                        </span>
                                                    </div>

                                                    {/* ส่วนราคา */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{
                                                            width: '13px',
                                                            height: '13px',
                                                            borderRadius: '50%',
                                                            background: '#fcc419',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#000',
                                                            boxShadow: '0 0 4px rgba(252, 196, 25, 0.3)'
                                                        }}>
                                                            <span style={{ fontSize: '9px', fontWeight: '900' }}>$</span>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            color: '#fcc419',
                                                            fontWeight: '800',
                                                            fontFamily: 'Orbitron, sans-serif'
                                                        }}>
                                                            {(item.trader_price || item.value).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                        <div style={{ fontSize: '16px', color: 'var(--arc-yellow)', marginBottom: '10px' }}>NO STOCK AVAILABLE</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                        {/* <div style={{
                            background: 'rgba(255, 200, 0, 0.05)',
                            border: '1px dashed rgba(255, 201, 0, 0.3)',
                            padding: '15px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: 'var(--arc-yellow)',
                            marginBottom: '15px'
                        }}>
                            PLEASE LOGIN TO TRADE WITH {activeTrader.name}
                        </div> */}
                        {/* <ArcButton color="blue" style={{ width: '100%' }}>
                            VIEW MARKETPLACE
                        </ArcButton> */}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {hoveredItem && (
                    <Tooltip
                        item={hoveredItem}
                        details={itemDetails[hoveredItem.id]}
                        position={mousePosition}
                    />
                )}
            </AnimatePresence>

            <style>{`
        .traders-page {
          --arc-cyan: #00ffff;
          --arc-yellow: #ffc800;
        }

        .traders-grid {
          position: relative;
        }
        
        @media (max-width: 1400px) {
          .traders-grid {
            gridTemplateColumns: '200px 250px 1fr';
          }
          .inventory-grid {
             gridTemplateColumns: 'repeat(5, 1fr)' !important;
          }
        }

        @media (max-width: 1000px) {
          .traders-grid {
            gridTemplateColumns: 1fr;
            overflowY: auto;
            height: auto;
          }
          .traders-grid > div {
            height: auto;
            border: none !important;
            max-width: none !important;
          }
          .inventory-grid {
             gridTemplateColumns: 'repeat(5, 1fr)' !important;
          }
        }

        /* Custom Scrollbar for Inventory */
        .inventory-scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .inventory-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .inventory-scroll-container::-webkit-scrollbar-thumb {
          background: var(--arc-cyan);
          border-radius: 10px;
          box-shadow: 0 0 10px var(--arc-cyan);
        }
      `}</style>
        </div>
    );
};

export default Traders;

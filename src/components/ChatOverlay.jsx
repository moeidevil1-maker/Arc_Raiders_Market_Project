import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users as UsersIcon, MessageCircle, Volume2, Trash2, Search, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ChatOverlay = ({ isOpen, onClose, currentUser, onUnreadCountChange }) => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadMessages, setUnreadMessages] = useState({});
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // For mobile drawer

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // Play notification sound
    const playNotificationSound = () => {
        if (!isSoundEnabled) return;

        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (selectedChat && currentUser) {
            fetchMessages();
            subscribeToMessages();
            // Close mobile menu when chat is selected
            if (window.innerWidth <= 768) {
                setIsMobileMenuOpen(false);
            }
        }

        return () => {
            // Cleanup subscription when chat changes
            const channelName = `messages-${currentUser?.id}`;
            supabase.channel(channelName).unsubscribe();
        };
    }, [selectedChat, currentUser]);

    // Global listener for all incoming messages (for notifications)
    useEffect(() => {
        if (!currentUser || !isOpen) return;

        const globalChannel = supabase
            .channel(`global-messages-${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    // Only count messages received by current user
                    if (payload.new.receiver_id === currentUser.id && payload.new.sender_id !== selectedChat?.id) {
                        // Play notification sound
                        playNotificationSound();

                        setUnreadMessages(prev => {
                            const newUnread = {
                                ...prev,
                                [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
                            };
                            // Update total unread count for navbar
                            const total = Object.values(newUnread).reduce((sum, count) => sum + count, 0);
                            onUnreadCountChange?.(total);
                            return newUnread;
                        });

                        // Move sender to top of user list
                        setUsers(prevUsers => {
                            const senderIndex = prevUsers.findIndex(u => u.id === payload.new.sender_id);
                            if (senderIndex > 0) {
                                const sender = prevUsers[senderIndex];
                                const newUsers = [...prevUsers];
                                newUsers.splice(senderIndex, 1);
                                newUsers.unshift(sender);
                                return newUsers;
                            }
                            return prevUsers;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            globalChannel.unsubscribe();
        };
    }, [currentUser, isOpen, selectedChat, onUnreadCountChange]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('email', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedChat || !currentUser) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedMessages = data.map(msg => ({
                id: msg.id,
                sender: msg.sender_id === currentUser.id ? currentUser.email : selectedChat.email,
                text: msg.message,
                timestamp: msg.created_at,
                isCurrentUser: msg.sender_id === currentUser.id
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error.message);
        }
    };

    const subscribeToMessages = () => {
        if (!selectedChat || !currentUser) return;

        // Create a unique channel name for this chat session
        const channelName = `messages-${currentUser.id}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('New message received:', payload);

                    // Check if message is part of current conversation
                    const isInCurrentChat =
                        (payload.new.sender_id === selectedChat.id && payload.new.receiver_id === currentUser.id) ||
                        (payload.new.sender_id === currentUser.id && payload.new.receiver_id === selectedChat.id);

                    if (isInCurrentChat && payload.new.sender_id === selectedChat.id) {
                        // Play notification sound for messages in current chat
                        playNotificationSound();

                        // Message from the person we're chatting with
                        const newMessage = {
                            id: payload.new.id,
                            sender: selectedChat.email,
                            text: payload.new.message,
                            timestamp: payload.new.created_at,
                            isCurrentUser: false
                        };
                        setMessages(prev => [...prev, newMessage]);
                    } else if (payload.new.sender_id !== currentUser.id && payload.new.receiver_id === currentUser.id) {
                        // Message from someone else (not in current chat)
                        setUnreadMessages(prev => ({
                            ...prev,
                            [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
                        }));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            channel.unsubscribe();
        };
    };

    const handleSelectChat = (user) => {
        setSelectedChat(user);
        // Clear unread count for this user
        setUnreadMessages(prev => {
            const newUnread = { ...prev, [user.id]: 0 };
            // Update total unread count
            const total = Object.values(newUnread).reduce((sum, count) => sum + count, 0);
            onUnreadCountChange?.(total);
            return newUnread;
        });
        setMessages([]);
    };

    const handleDeleteChatHistory = async () => {
        if (!selectedChat || !currentUser) return;

        const confirmDelete = window.confirm(
            `คุณต้องการลบประวัติการสนทนากับ ${selectedChat.email} ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`
        );

        if (!confirmDelete) return;

        try {
            // Delete all messages between current user and selected chat
            const { error } = await supabase
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`);

            if (error) throw error;

            // Clear local messages
            setMessages([]);
            alert('ลบประวัติการสนทนาเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Error deleting chat history:', error.message);
            alert('ไม่สามารถลบประวัติการสนทนาได้ กรุณาลองใหม่อีกครั้ง');
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat || !currentUser) return;

        const messageText = messageInput;
        setMessageInput(''); // Clear input immediately for better UX

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        sender_id: currentUser.id,
                        receiver_id: selectedChat.id,
                        message: messageText
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Add message to local state
            const newMessage = {
                id: data.id,
                sender: currentUser.email,
                text: data.message,
                timestamp: data.created_at,
                isCurrentUser: true
            };

            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Error sending message:', error.message);
            alert('ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
            setMessageInput(messageText); // Restore message on error
        }
    };

    const filteredUsers = users.filter(user =>
        user.id !== currentUser?.id &&
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={overlayBackdrop}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    style={chatContainer}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Mobile Menu Toggle */}
                            <div
                                className="hide-desktop"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                style={{ ...iconButton, marginRight: '5px' }}
                            >
                                <Menu size={20} />
                            </div>
                            <MessageCircle size={20} color="var(--arc-yellow)" />
                            <span style={headerTitle}>ข้อความ</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div
                                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                                style={{ ...iconButton, color: isSoundEnabled ? 'var(--arc-yellow)' : 'rgba(255,255,255,0.3)' }}
                                title={isSoundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
                            >
                                <Volume2 size={18} />
                            </div>
                            {selectedChat && (
                                <div
                                    onClick={handleDeleteChatHistory}
                                    style={{ ...iconButton, color: '#ff4444' }}
                                    title="ลบประวัติการสนทนา"
                                >
                                    <Trash2 size={18} />
                                </div>
                            )}
                            <X size={20} style={iconButton} onClick={onClose} />
                        </div>
                    </div>

                    {/* Main Content - Split Panel */}
                    <div style={mainContent}>
                        {/* Left Panel - User List */}
                        <div style={{
                            ...leftPanel,
                            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                        }}>
                            <div style={searchContainer}>
                                <Search size={16} color="rgba(255,255,255,0.4)" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาผู้ใช้..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={searchInput}
                                />
                            </div>

                            <div style={userListContainer}>
                                {loading ? (
                                    <div style={centerText}>กำลังโหลด...</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div style={centerText}>ไม่พบผู้ใช้</div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectChat(user)}
                                            style={{
                                                ...userItem,
                                                background: selectedChat?.id === user.id ? 'rgba(255, 200, 0, 0.1)' : '#111',
                                                borderLeft: selectedChat?.id === user.id ? '3px solid var(--arc-yellow)' : '3px solid transparent'
                                            }}
                                        >
                                            <div style={userAvatar}>
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={userName}>{user.email}</p>
                                                <p style={userStatus}>
                                                    <span style={onlineDot}></span>
                                                    Online
                                                </p>
                                            </div>
                                            {unreadMessages[user.id] > 0 && (
                                                <div style={unreadBadge}>{unreadMessages[user.id]}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Chat Area */}
                        <div style={rightPanel}>
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div style={chatHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={userAvatar}>
                                                {selectedChat.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={chatHeaderName}>{selectedChat.email}</p>
                                                <p style={chatHeaderStatus}>
                                                    <span style={onlineDot}></span>
                                                    Online
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div style={messagesContainer}>
                                        {messages.length === 0 ? (
                                            <div style={centerText}>
                                                <MessageCircle size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '15px' }} />
                                                <p>เริ่มต้นการสนทนา</p>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                                    ส่งข้อความแรกเพื่อเริ่มแชทกับ {selectedChat.email}
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map(msg => (
                                                <div
                                                    key={msg.id}
                                                    style={{
                                                        ...messageBubble,
                                                        alignSelf: msg.isCurrentUser ? 'flex-end' : 'flex-start',
                                                        background: msg.isCurrentUser ? 'var(--arc-yellow)' : '#1a1a1a',
                                                        color: msg.isCurrentUser ? '#000' : '#fff'
                                                    }}
                                                >
                                                    {!msg.isCurrentUser && <p style={messageSender}>{msg.sender}</p>}
                                                    <p style={messageText}>{msg.text}</p>
                                                    <p style={{
                                                        ...messageTime,
                                                        color: msg.isCurrentUser ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
                                                    }}>
                                                        {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Input */}
                                    <div style={inputContainer}>
                                        <input
                                            type="text"
                                            placeholder="พิมพ์ข้อความ..."
                                            value={messageInput}
                                            onChange={(e) => {
                                                console.log('Input changed:', e.target.value);
                                                setMessageInput(e.target.value);
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            onFocus={() => console.log('Input focused')}
                                            onBlur={() => console.log('Input blurred')}
                                            style={messageInputStyle}
                                            autoComplete="off"
                                        />
                                        <button style={sendButton} onClick={handleSendMessage}>
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={emptyState}>
                                    <MessageCircle size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: '20px' }} />
                                    <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                                        เลือกผู้ใช้เพื่อเริ่มแชท
                                    </p>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                        คลิกที่รายชื่อด้านซ้ายเพื่อเริ่มการสนทนา
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Styles with Responsive Design
const overlayBackdrop = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px'
};

const chatContainer = {
    width: '100%',
    maxWidth: window.innerWidth <= 768 ? '100%' : '1100px',
    height: window.innerWidth <= 768 ? '100%' : '700px',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: window.innerWidth <= 768 ? '0' : '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
};

const headerStyle = {
    padding: window.innerWidth <= 768 ? '15px 15px' : '20px 25px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#050505'
};

const headerTitle = {
    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: '0.5px'
};

const iconButton = {
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.5)',
    transition: 'color 0.2s'
};

const mainContent = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative'
};

const leftPanel = {
    width: window.innerWidth <= 768 ? '280px' : '320px',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    background: '#050505',
    position: window.innerWidth <= 768 ? 'absolute' : 'relative',
    height: '100%',
    zIndex: 10,
    transition: 'transform 0.3s ease'
};

const searchContainer = {
    padding: '15px',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#0a0a0a'
};

const searchInput = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
};

const userListContainer = {
    flex: 1,
    overflowY: 'auto',
    padding: '10px'
};

const userItem = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    marginBottom: '5px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const userAvatar = {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--arc-cyan), var(--arc-yellow))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000'
};

const userName = {
    margin: 0,
    fontSize: window.innerWidth <= 768 ? '12px' : '13px',
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
};

const userStatus = {
    margin: 0,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
};

const onlineDot = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#00ff00'
};

const unreadBadge = {
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    background: 'var(--arc-yellow)',
    color: '#000',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px'
};

const rightPanel = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a'
};

const chatHeader = {
    padding: window.innerWidth <= 768 ? '12px 15px' : '15px 20px',
    borderBottom: '1px solid #222',
    background: '#050505'
};

const chatHeaderName = {
    margin: 0,
    fontSize: window.innerWidth <= 768 ? '13px' : '14px',
    fontWeight: 'bold',
    color: '#fff'
};

const chatHeaderStatus = {
    margin: 0,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '3px'
};

const messagesContainer = {
    flex: 1,
    overflowY: 'auto',
    padding: window.innerWidth <= 768 ? '15px' : '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const centerText = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255,255,255,0.3)',
    fontSize: window.innerWidth <= 768 ? '13px' : '14px',
    padding: '20px',
    textAlign: 'center'
};

const emptyState = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255,255,255,0.3)'
};

const messageBubble = {
    maxWidth: window.innerWidth <= 768 ? '85%' : '70%',
    padding: window.innerWidth <= 768 ? '8px 12px' : '10px 15px',
    borderRadius: '12px',
    marginBottom: '5px'
};

const messageSender = {
    margin: 0,
    fontSize: '10px',
    fontWeight: 'bold',
    marginBottom: '5px',
    opacity: 0.7
};

const messageText = {
    margin: 0,
    fontSize: window.innerWidth <= 768 ? '12px' : '13px',
    lineHeight: '1.4',
    wordWrap: 'break-word'
};

const messageTime = {
    margin: 0,
    fontSize: '9px',
    marginTop: '5px'
};

const inputContainer = {
    padding: window.innerWidth <= 768 ? '15px' : '20px',
    borderTop: '1px solid #222',
    display: 'flex',
    gap: '10px',
    background: '#050505'
};

const messageInputStyle = {
    flex: 1,
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: window.innerWidth <= 768 ? '10px 12px' : '12px 15px',
    color: '#fff',
    fontSize: window.innerWidth <= 768 ? '12px' : '13px',
    outline: 'none'
};

const sendButton = {
    background: 'var(--arc-yellow)',
    border: 'none',
    borderRadius: '8px',
    padding: window.innerWidth <= 768 ? '10px 15px' : '12px 20px',
    color: '#000',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

export default ChatOverlay;

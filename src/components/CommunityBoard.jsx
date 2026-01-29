import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
    Image as ImageIcon,
    Smile,
    Heart,
    MessageSquare,
    Share2,
    MoreHorizontal,
    Send,
    ThumbsUp
} from 'lucide-react';

const CommunityBoard = ({ currentUser }) => {
    // Mock Data for POC
    const [posts, setPosts] = useState([]);

    // States
    const [newPostContent, setNewPostContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeMenuPostId, setActiveMenuPostId] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [deleteConfirmPostId, setDeleteConfirmPostId] = useState(null);
    const [commentInputs, setCommentInputs] = useState({});

    // Comment Edit States
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');
    const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);
    const [activeCommentEmojiPostId, setActiveCommentEmojiPostId] = useState(null);

    // Handlers
    const handlePost = () => {
        if (!newPostContent.trim()) return;

        const newPost = {
            id: Date.now(),
            user: {
                name: currentUser?.email?.split('@')[0] || 'Guest Raider',
                avatar: currentUser?.user_metadata?.avatar_url || null,
                time: 'Just Now'
            },
            content: newPostContent,
            image: null,
            likes: 0,
            comments: [],
            isLiked: false
        };

        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setShowEmojiPicker(false);
    };

    const onPostEmojiClick = (emojiObject) => {
        setNewPostContent(prev => prev + emojiObject.emoji);
    };

    const onCommentEmojiClick = (emojiObject) => {
        if (activeCommentEmojiPostId) {
            setCommentInputs(prev => ({
                ...prev,
                [activeCommentEmojiPostId]: (prev[activeCommentEmojiPostId] || '') + emojiObject.emoji
            }));
        }
    };

    const toggleLike = (postId) => {
        setPosts(posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                    isLiked: !p.isLiked
                };
            }
            return p;
        }));
    };

    const handleDeletePost = (postId) => {
        setDeleteConfirmPostId(postId);
        setActiveMenuPostId(null);
    };

    const confirmDelete = () => {
        if (deleteConfirmPostId) {
            setPosts(posts.filter(p => p.id !== deleteConfirmPostId));
            setDeleteConfirmPostId(null);
        }
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
        setActiveMenuPostId(null);
    };

    const handleSaveEdit = (postId) => {
        if (!editContent.trim()) return;

        setPosts(posts.map(p => {
            if (p.id === postId) {
                return { ...p, content: editContent };
            }
            return p;
        }));

        setEditingPostId(null);
        setEditContent('');
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditContent('');
    };

    const handleCommentChange = (postId, value) => {
        setCommentInputs(prev => ({
            ...prev,
            [postId]: value
        }));
    };

    const handleSubmitComment = (postId) => {
        const content = commentInputs[postId];
        if (!content || !content.trim()) return;

        const newComment = {
            id: Date.now(),
            user: currentUser?.email?.split('@')[0] || 'Guest Raider',
            avatar: currentUser?.user_metadata?.avatar_url || null,
            content: content,
            time: 'Just Now'
        };

        setPosts(posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: [...p.comments, newComment]
                };
            }
            return p;
        }));

        setCommentInputs(prev => ({
            ...prev,
            [postId]: ''
        }));
        setActiveCommentEmojiPostId(null);
    };

    // Comment Edit Handlers
    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditCommentContent(comment.content);
        setActiveCommentMenuId(null); // Close menu
    };

    const handleDeleteComment = (postId, commentId) => {
        if (window.confirm('ต้องการลบคอมเมนต์นี้?')) {
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        comments: p.comments.filter(c => c.id !== commentId)
                    };
                }
                return p;
            }));
            setActiveCommentMenuId(null);
        }
    };

    const handleSaveEditComment = (postId, commentId) => {
        if (!editCommentContent.trim()) return;

        setPosts(posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: p.comments.map(c =>
                        c.id === commentId ? { ...c, content: editCommentContent } : c
                    )
                };
            }
            return p;
        }));

        setEditingCommentId(null);
        setEditCommentContent('');
    };

    const handleCancelEditComment = () => {
        setEditingCommentId(null);
        setEditCommentContent('');
    };

    return (
        <div
            style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 20px', color: '#fff' }}
            onClick={() => {
                setActiveMenuPostId(null);
                setShowEmojiPicker(false);
                setActiveCommentMenuId(null);
                setActiveCommentEmojiPostId(null);
            }}
        >
            {/* Page Header */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' }}>COMMUNITY FEED</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>พื้นที่พูดคุย แลกเปลี่ยนข้อมูล และขิงของสำหรับ Raiders ไทย</p>
            </div>

            {/* Create Post Widget */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '30px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                        {currentUser?.user_metadata?.avatar_url ? (
                            <img src={currentUser.user_metadata.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF0080 0%, #7928CA 100%)' }} />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <textarea
                            placeholder="คุณกำลังคิดอะไรอยู่..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#252525',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '15px',
                                color: '#fff',
                                fontSize: '16px',
                                minHeight: '100px',
                                resize: 'none',
                                outline: 'none',
                                marginBottom: '15px'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button style={{ ...actionButtonStyle, color: '#4ade80' }}>
                                    <ImageIcon size={20} /> <span style={{ marginLeft: '5px' }}>รูปภาพ</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(!showEmojiPicker);
                                    }}
                                    style={{ ...actionButtonStyle, color: '#facc15' }}
                                >
                                    <Smile size={20} /> <span style={{ marginLeft: '5px' }}>Emoji</span>
                                </button>
                            </div>

                            {/* Emoji Picker */}
                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '10px' }}
                                    >
                                        <EmojiPicker onEmojiClick={onPostEmojiClick} theme="dark" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handlePost}
                                style={{
                                    background: '#0066ff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 24px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Send size={16} /> โพสต์
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map(post => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#1a1a1a',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            overflow: 'visible'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                                    {post.user.avatar ? (
                                        <img src={post.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#888', fontWeight: 'bold' }}>
                                            {post.user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{post.user.name}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{post.user.time}</div>
                                </div>
                            </div>

                            {/* Menu Dropdown */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '5px' }}
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                <AnimatePresence>
                                    {activeMenuPostId === post.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                background: '#252525',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                padding: '5px',
                                                zIndex: 10,
                                                minWidth: '150px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <button
                                                onClick={() => handleEditPost(post)}
                                                className="hover-bg-light"
                                                style={menuItemStyle}
                                            >
                                                แก้ไขโพสต์
                                            </button>
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 0' }}></div>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="hover-bg-light"
                                                style={{ ...menuItemStyle, color: '#ff4444' }}
                                            >
                                                ลบโพสต์
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '0 20px 20px 20px' }}>
                            {editingPostId === post.id ? (
                                <div style={{ marginTop: '10px' }}>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            background: '#252525',
                                            border: '1px solid #007bff',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            color: '#fff',
                                            minHeight: '80px',
                                            fontSize: '15px',
                                            resize: 'vertical',
                                            marginBottom: '10px',
                                            outline: 'none'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#ccc',
                                                padding: '6px 15px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            onClick={() => handleSaveEdit(post.id)}
                                            style={{
                                                background: '#007bff',
                                                border: 'none',
                                                color: '#fff',
                                                padding: '6px 20px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            บันทึก
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: post.image ? '15px' : '0', whiteSpace: 'pre-wrap' }}>
                                    {post.content}
                                </p>
                            )}

                            {post.image && (
                                <img src={post.image} style={{ width: '100%', borderRadius: '12px', marginTop: '10px' }} />
                            )}
                        </div>

                        {/* Interaction Bar */}
                        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '30px' }}>
                            <button
                                onClick={() => toggleLike(post.id)}
                                style={{ ...interactionBtnStyle, color: post.isLiked ? '#ff4444' : 'rgba(255,255,255,0.6)' }}
                            >
                                <Heart size={20} fill={post.isLiked ? "#ff4444" : "none"} /> <span>{post.likes}</span>
                            </button>
                            <button style={interactionBtnStyle}>
                                <MessageSquare size={20} /> <span>{post.comments.length}</span>
                            </button>
                            <button style={interactionBtnStyle}>
                                <Share2 size={20} />
                            </button>
                        </div>

                        {/* Comment List */}
                        {post.comments.length > 0 && (
                            <div style={{ padding: '0 20px 15px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {post.comments.map(comment => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                                            {comment.avatar ? (
                                                <img src={comment.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#444', color: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                    {comment.user.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: '#252525', padding: '10px 15px', borderRadius: '12px', flex: 1, position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{comment.user}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{comment.time}</span>
                                                    {/* Edit/Delete Menu - Only for owner */}
                                                    {currentUser?.email?.split('@')[0] === comment.user && (
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveCommentMenuId(activeCommentMenuId === comment.id ? null : comment.id);
                                                                }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: 'rgba(255,255,255,0.4)',
                                                                    padding: '0 4px'
                                                                }}
                                                            >
                                                                <MoreHorizontal size={14} />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            <AnimatePresence>
                                                                {activeCommentMenuId === comment.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            right: 0,
                                                                            top: '100%',
                                                                            background: '#252525',
                                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                                            borderRadius: '8px',
                                                                            padding: '4px',
                                                                            zIndex: 10,
                                                                            minWidth: '100px',
                                                                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                                                                        }}
                                                                    >
                                                                        <button
                                                                            onClick={() => handleEditComment(comment)}
                                                                            style={{
                                                                                ...menuItemStyle,
                                                                                fontSize: '12px',
                                                                                padding: '8px 12px'
                                                                            }}
                                                                        >
                                                                            แก้ไข
                                                                        </button>
                                                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 0' }}></div>
                                                                        <button
                                                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                            style={{
                                                                                ...menuItemStyle,
                                                                                fontSize: '12px',
                                                                                color: '#ff4444',
                                                                                padding: '8px 12px'
                                                                            }}
                                                                        >
                                                                            ลบ
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Edit Mode vs Display Mode */}
                                            {editingCommentId === comment.id ? (
                                                <div style={{ marginTop: '8px' }}>
                                                    <textarea
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                        autoFocus
                                                        style={{
                                                            width: '100%',
                                                            background: '#151515',
                                                            border: '1px solid #007bff',
                                                            borderRadius: '8px',
                                                            padding: '8px',
                                                            color: '#fff',
                                                            fontSize: '14px',
                                                            minHeight: '60px',
                                                            resize: 'vertical',
                                                            marginBottom: '8px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={handleCancelEditComment}
                                                            style={{
                                                                background: 'transparent',
                                                                border: '1px solid rgba(255,255,255,0.2)',
                                                                color: '#ccc',
                                                                padding: '4px 10px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEditComment(post.id, comment.id)}
                                                            style={{
                                                                background: '#007bff',
                                                                border: 'none',
                                                                color: '#fff',
                                                                padding: '4px 12px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            บันทึก
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '14px', margin: 0, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                                                    {comment.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Comment Input */}
                        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                                    {currentUser?.user_metadata?.avatar_url ? (
                                        <img src={currentUser.user_metadata.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF0080 0%, #7928CA 100%)' }} />
                                    )}
                                </div>
                                <div style={{
                                    flex: 1,
                                    background: '#151515',
                                    borderRadius: '20px',
                                    padding: '8px 15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid #007bffaa',
                                    boxShadow: '0 0 5px rgba(0, 123, 255, 0.1)',
                                    position: 'relative'
                                }}>
                                    <input
                                        type="text"
                                        placeholder="เขียนความคิดเห็น..."
                                        value={commentInputs[post.id] || ''}
                                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '14px'
                                        }}
                                    />

                                    <Smile
                                        size={18}
                                        color={activeCommentEmojiPostId === post.id ? "#facc15" : "#666"}
                                        style={{ cursor: 'pointer', marginRight: '10px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveCommentEmojiPostId(activeCommentEmojiPostId === post.id ? null : post.id);
                                        }}
                                    />

                                    <Send
                                        size={18}
                                        color={commentInputs[post.id]?.trim() ? "#007bff" : "#555"}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSubmitComment(post.id)}
                                    />

                                    {/* Comment Emoji Picker */}
                                    <AnimatePresence>
                                        {activeCommentEmojiPostId === post.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 100, marginBottom: '10px' }}
                                            >
                                                <EmojiPicker onEmojiClick={onCommentEmojiClick} theme="dark" width={300} height={400} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmPostId && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmPostId(null)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#1a1a1a',
                                padding: '30px',
                                borderRadius: '16px',
                                maxWidth: '400px',
                                width: '100%',
                                zIndex: 1,
                                border: '1px solid rgba(255,0,0,0.3)',
                                textAlign: 'center'
                            }}
                        >
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>ยืนยันการลบโพสต์?</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '25px' }}>
                                คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setDeleteConfirmPostId(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        flex: 1
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        background: '#ff4444',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        flex: 1
                                    }}
                                >
                                    ลบโพสต์
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Styles
const actionButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '14px'
};

const interactionBtnStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontSize: '14px'
};

const menuItemStyle = {
    background: 'transparent',
    border: 'none',
    width: '100%',
    padding: '10px 15px',
    textAlign: 'left',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    display: 'block',
    transition: 'background 0.2s',
    outline: 'none'
};

export default CommunityBoard;

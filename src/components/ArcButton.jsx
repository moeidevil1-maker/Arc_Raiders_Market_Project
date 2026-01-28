import React from 'react';
import { motion } from 'framer-motion';

const ArcButton = ({ children, color = 'blue', onClick, className = '' }) => {
  const colorMap = {
    blue: 'var(--btn-blue)',
    green: 'var(--btn-green)',
    red: 'var(--btn-red)',
    yellow: 'var(--btn-yellow)',
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${selectedColor}` }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        backgroundColor: 'transparent',
        border: `2px solid ${selectedColor}`,
        color: '#fff',
        padding: '12px 24px',
        fontSize: '1rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        cursor: 'pointer',
        borderRadius: '4px',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background-color 0.3s ease',
      }}
      className={`arc-button ${className}`}
      onContextMenu={(e) => {
          // Custom hover effect for filling background
          e.currentTarget.style.backgroundColor = selectedColor;
      }}
      onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = selectedColor;
      }}
    >
      {children}
    </motion.button>
  );
};

export default ArcButton;

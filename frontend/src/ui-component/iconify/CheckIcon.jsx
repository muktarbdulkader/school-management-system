import React from 'react';
import { motion } from 'framer-motion';
import { IconCheck } from '@tabler/icons-react';

const AnimatedCheckIcon = () => {
  // Animation Variants
  const iconVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -45
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        ease: 'easeInOut'
      }
    },
    hover: {
      scale: 1.2,
      color: '#2ecc71', // Green color on hover
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const checkPathVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: {
        duration: 1,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: 'green',
        borderRadius: '50%',
        padding: 10
      }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="50"
        height="50"
        style={{ color: '#fff' }}
        variants={iconVariants}
      >
        <motion.path
          d="M20 6L9 17L4 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkPathVariants}
        />
      </motion.svg>
    </motion.div>
  );
};

export default AnimatedCheckIcon;

import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';

const DrogaDonutChart = ({ value, size, color }) => {
  const theme = useTheme();
  const controls = useAnimation();

  const strokeWidth = size && size > 0 ? size / 2.7 : 16;
  const radius = size && size > 0 ? size : 42;
  const normalizedRadius = radius - strokeWidth / 1.8;
  const circumference = normalizedRadius * 2 * Math.PI;
  const finalStrokeOffset = value > 100 ? circumference - (value / value) * circumference : circumference - (value / 100) * circumference;

  const handleMouseEnter = () => {
    if (value) {
      controls.start({
        strokeDashoffset: [finalStrokeOffset, circumference, finalStrokeOffset],
        transition: { duration: 1, ease: 'easeInOut' }
      });
    }
  };

  return (
    <div style={{ height: radius * 2.2, width: radius * 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg height={radius * 2.1} width={radius * 2.1} onMouseEnter={handleMouseEnter}>
        <defs>
          <filter id="stroke-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feOffset dx="0" dy="2" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          stroke={theme.palette.grey[200]}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={value > 0 ? color : theme.palette.grey[200]}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          animate={controls}
          strokeLinecap="round"
          filter="url(#stroke-shadow)"
          initial={{ strokeDashoffset: finalStrokeOffset }}
          style={{ strokeOpacity: 0.9 }}
        />
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          fontSize={`${size && size > 0 ? size / 2.8 : 16}px`}
          fill={theme.palette.text.primary}
        >
          {`${value}%`}
        </text>
      </svg>
    </div>
  );
};

DrogaDonutChart.propTypes = {
  value: PropTypes.number.isRequired,
  size: PropTypes.number,
  color: PropTypes.string
};

export default DrogaDonutChart;

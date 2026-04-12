import { Box, Card, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';

export function DashboardCard({
  icon,
  title,
  description,
  buttonText,
  buttonHref,
  statusText,
  statusColor = '#22c55e',
  gradientFrom = '#3b82f6',
  gradientTo = '#8b5cf6',
  onClick,
}) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 260,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.08), 0 0 4px rgba(0,0,0,0.02)',
          borderColor: 'transparent',
          '& .action-btn': {
            backgroundColor: gradientFrom,
            color: '#fff',
            transform: 'translateX(4px)',
          },
          '& .icon-bg': {
            transform: 'scale(1.05) rotate(-5deg)',
          }
        },
      }}
    >
      {/* Top Section */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box
            className="icon-bg"
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${gradientFrom}15, ${gradientTo}25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: gradientFrom,
              transition: 'transform 0.4s ease',
            }}
          >
            {icon}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: `${statusColor}15`,
              px: 1.5,
              py: 0.5,
              borderRadius: 'full',
              border: `1px solid ${statusColor}30`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                backgroundColor: statusColor,
                borderRadius: '50%',
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
            <Typography variant="caption" sx={{ color: statusColor, fontWeight: 600, fontSize: '0.75rem' }}>
              {statusText}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1.5, letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>
          {description}
        </Typography>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 3, zIndex: 1 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: gradientFrom, 
            fontWeight: 700, 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.875rem'
          }}
        >
          {buttonText}
        </Typography>
        
        <Box
          className="action-btn"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </Box>
      </Box>
      
      {/* Decorative gradient blur in background */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: -40,
          right: -40,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${gradientTo}15 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </Card>
  );
}

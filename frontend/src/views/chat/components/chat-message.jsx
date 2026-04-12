import { Box, Avatar, Typography } from '@mui/material';

export function ChatMessage({
  sender,
  senderRole,
  avatar,
  content,
  time,
  isUser,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && (
        <Avatar src={avatar} alt={sender} sx={{ width: 32, height: 32 }} />
      )}
      <Box
        sx={{
          maxWidth: '70%',
          borderRadius: 2,
          p: 1.5,
          bgcolor: isUser ? 'primary.light' : 'grey.200',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          ...(isUser && { ml: 'auto' }), // Push user messages to the right
        }}
      >
        {!isUser && (
          <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 0.5 }}>
            {sender}{' '}
            {senderRole && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                ({senderRole})
              </Typography>
            )}
          </Typography>
        )}
        <Typography variant="body2">{content}</Typography>
        <Typography
          variant="caption"
          color={isUser ? 'primary.contrastText' : 'text.secondary'}
          sx={{
            display: 'block',
            mt: 0.5,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  );
}

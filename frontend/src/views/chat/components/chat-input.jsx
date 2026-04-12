import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export function ChatInput({ value, onChange, onSend }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
      />
      <IconButton color="primary" onClick={onSend} disabled={!value.trim()}>
        <SendIcon />
      </IconButton>
    </Box>
  );
}

import React from 'react';
import { 
  Card, CardContent, Typography, Box, Chip, Stack, 
  IconButton, Tooltip, Avatar, LinearProgress
} from '@mui/material';
import { 
  IconCalendar, IconFlag, IconEdit, IconTrash, 
  IconCheck, IconLoader2, IconCircleCheck, 
  IconAlertCircle, IconClock
} from '@tabler/icons-react';

const priorityInfo = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'info', label: 'Medium' },
  high: { color: 'warning', label: 'High' },
  urgent: { color: 'error', label: 'Urgent' }
};

const statusInfo = {
  to_do: { color: 'default', label: 'To Do', icon: <IconClock size={16}/> },
  in_progress: { color: 'primary', label: 'In Progress', icon: <IconLoader2 size={16} className="animate-spin"/> },
  done: { color: 'success', label: 'Done', icon: <IconCircleCheck size={16}/> },
  cancelled: { color: 'error', label: 'Cancelled', icon: <IconAlertCircle size={16}/> },
  expired: { color: 'error', label: 'Overdue', icon: <IconAlertCircle size={16}/> }
};

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const p = priorityInfo[task.priority] || priorityInfo.medium;
  const s = statusInfo[task.status] || statusInfo.to_do;
  const isOverdue = task.is_overdue || task.status === 'expired';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderLeft: 4,
        borderColor: isOverdue ? 'error.main' : p.color + '.main',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Chip 
            size="small" 
            label={s.label} 
            color={isOverdue ? 'error' : s.color} 
            variant="light"
            icon={s.icon}
          />
          <Chip 
            size="small" 
            label={p.label} 
            color={p.color} 
            variant="outlined" 
            icon={<IconFlag size={14}/>}
          />
        </Stack>

        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ 
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? 'text.secondary' : 'text.primary'
        }}>
          {task.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2, 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden' 
        }}>
          {task.description}
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconCalendar size={14} color="#666"/>
            <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'} fontWeight={isOverdue ? 700 : 400}>
              Due: {task.due_date} {isOverdue && '(Overdue)'}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={-0.5}>
              <Tooltip title={`Assigned to ${task.assigned_to_name}`}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main' }}>
                  {task.assigned_to_name?.[0]}
                </Avatar>
              </Tooltip>
              {task.created_by_name !== task.assigned_to_name && (
                <Tooltip title={`Created by ${task.created_by_name}`}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'secondary.main' }}>
                    {task.created_by_name?.[0]}
                  </Avatar>
                </Tooltip>
              )}
            </Stack>

            <Box>
              <Tooltip title="Mark Done">
                <IconButton 
                  size="small" 
                  color="success" 
                  disabled={task.status === 'done'}
                  onClick={() => onStatusChange(task, 'done')}
                >
                  <IconCheck size={18}/>
                </IconButton>
              </Tooltip>
              <IconButton size="small" color="primary" onClick={() => onEdit(task)}>
                <IconEdit size={18}/>
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(task.id)}>
                <IconTrash size={18}/>
              </IconButton>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

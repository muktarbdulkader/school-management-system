export const NotificationRedirection = (body, navigate) => {
  const type = body?.type;
  switch (type) {
    case 'evaluation_approval':
      navigate('/my-evaluations', { state: { id: body?.workflow_id } });
      break;
    case 'task_approval':
      navigate('/my-team/member/tasks', {
        state: {
          id: body.from.id,
          // taskId: body.id,
          name: body.from.name,
        },
      });
      break;
    case 'eod_report':
    case 'my_report':
      navigate('/teacher-reports');
      break;
    case 'teacher_task':
    case 'task_assigned':
    case 'my_task':
      navigate('/teacher-tasks');
      break;
    case 'performance_report':
    case 'my_performance':
      navigate('/myperformance');
      break;
    default:
      navigate('/');
  }
};

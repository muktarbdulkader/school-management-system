const ApprovalWorkflow = {
  api: import.meta.env.VITE_WORKFLOW_URL,
  API_KEY: import.meta.env.VITE_WORKFLOW_API_KEY,
  id: 'applications/' + import.meta.env.VITE_WORKFLOW_ID,
  application: 'applications',
  steps: 'steps',
  assignRole: 'steps/assign',
  unAssignRole: 'steps/unassign',
  tasks: 'filter/tasks',
  taskAction: 'tasks/approve',
  updateStatus: 'update-status'
};

export default ApprovalWorkflow;

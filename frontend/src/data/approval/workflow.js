export const Workflow = [
  {
    id: 1,
    name: 'Planning',
    description:
      'In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before the final copy is available.'
  },
  {
    id: 2,
    name: 'Evaluation',
    description:
      'In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before the final copy is available.'
  }
];

export const Steps = [
  {
    id: 1,
    workflow_id: 1,
    step_number: 1,
    name: 'initialization',
    approvers: [
      {
        id: 1,
        approver_id: 21,
        name: 'supervisor'
      }
    ]
  },
  {
    id: 2,
    workflow_id: 1,
    step_number: 2,
    name: 'Review',
    approvers: [
      {
        id: 2,
        approver_id: 23,
        name: 'manager'
      }
    ]
  },
  {
    id: 3,
    workflow_id: 1,
    step_number: 3,
    name: 'Approval',
    approvers: [
      {
        id: 3,
        approver_id: 31,
        name: 'Task force'
      },
      {
        id: 4,
        approver_id: 34,
        name: 'Admin'
      }
    ]
  }
];

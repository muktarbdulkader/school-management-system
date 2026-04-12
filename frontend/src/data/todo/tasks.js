const Tasks = [
  {
    name: 'Contacting Customers',
    kpi_name: 'Customer acquisition',
    subtask_summary: '1 out of 5',
    status: 'to do',
    start_date: '2024-12-23',
    end_date: '2024-12-30',
    subtasks: [
      { name: 'Draft email template', status: 'to do', due_date: '2024-12-23' },
      { name: 'Segment customer list', status: 'to do', due_date: '2024-12-24' }
    ]
  },
  {
    name: 'Developing Website',
    kpi_name: 'Platform development',
    subtask_summary: '1 out of 5',
    status: 'to do',
    start_date: '2024-10-15',
    end_date: '2024-11-01',
    subtasks: [
      { name: 'Set up hosting and domain', status: 'in progress', due_date: '2024-10-16' },
      { name: 'Design homepage layout', status: 'in progress', due_date: '2024-10-17' },
      { name: 'Implement responsive navigation', status: 'in progress', due_date: '2024-10-18' },
      { name: 'Develop backend API for auth', status: 'to do', due_date: '2024-10-19' },
      { name: 'Test website across devices', status: 'to do', due_date: '2024-10-20' }
    ]
  },
  {
    name: 'Creating Product Roadmap',
    kpi_name: 'Strategic planning',
    subtask_summary: '1 out of 5',
    status: 'pending',
    start_date: '2024-10-10',
    end_date: '2024-10-20',
    subtasks: [{ name: 'Identify product milestones', status: 'in progress', due_date: '2024-10-11' }]
  },
  {
    name: 'Conducting Market Research',
    kpi_name: 'Market insights',
    subtask_summary: '1 out of 5',
    status: 'done',
    start_date: '2024-09-01',
    end_date: '2024-09-15',
    subtasks: [
      { name: 'Identify target demographics', status: 'completed', due_date: '2024-09-01' },
      { name: 'Design survey for insights', status: 'completed', due_date: '2024-09-02' },
      { name: 'Analyze competitor offerings', status: 'completed', due_date: '2024-09-03' }
    ]
  },
  {
    name: 'Improving Customer Service',
    kpi_name: 'Customer retention',
    subtask_summary: '4 out of 5',
    status: 'pending',
    start_date: '2024-10-05',
    end_date: '2024-10-25',
    subtasks: [
      { name: 'Review customer feedback', status: 'completed', due_date: '2024-10-06' },
      { name: 'Implement feedback response system', status: 'completed', due_date: '2024-10-07' },
      { name: 'Train customer service team', status: 'completed', due_date: '2024-10-08' },
      { name: 'Monitor service improvements', status: 'pending', due_date: '2024-10-09' },
      { name: 'Conduct post-improvement survey', status: 'to do', due_date: '2024-10-10' }
    ]
  },
  {
    name: 'Finalizing Investor Pitch',
    kpi_name: 'Fundraising',
    subtask_summary: '3 out of 25',
    status: 'done',
    start_date: '2024-12-01',
    end_date: '2024-12-10',
    subtasks: [
      { name: 'Outline key points for the pitch', status: 'done', due_date: '2024-12-02' },
      { name: 'Design pitch deck slides', status: 'done', due_date: '2024-12-03' },
      { name: 'Practice pitch presentation', status: 'done', due_date: '2024-12-04' },
      { name: 'Get feedback from mentors', status: 'done', due_date: '2024-12-05' },
      { name: 'Finalize the pitch', status: 'done', due_date: '2024-12-06' }
    ]
  },
  {
    name: 'Building Mobile App',
    kpi_name: 'App development',
    subtask_summary: '3 out of 30',
    status: 'blocked',
    start_date: '2024-11-15',
    end_date: '2024-12-20',
    subtasks: [{ name: 'Test app on Android and iOS', status: 'blocked', due_date: '2024-11-20' }]
  }
];

export default Tasks;

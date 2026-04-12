const KanbanColumns = [
  {
    name: 'all',
    primary_color: '#003b73',
    addTask: false,
    menu: true
  },
  {
    name: 'pending',
    primary_color: '#FFA500',
    addTask: false,
    menu: true
  },
  {
    name: 'expired',
    primary_color: '#D32F2F',
    addTask: false,
    menu: true
  },
  {
    name: 'todo',
    primary_color: '#b1b2b3',
    addTask: true,
    menu: true
  },

  {
    name: 'inprogress',
    primary_color: '#006BE1',
    addTask: true,
    menu: true
  },

  {
    name: 'done',
    primary_color: '#00B400',
    addTask: false,
    menu: true
  },
  {
    name: 'blocked',
    primary_color: '#AB47BC',
    addTask: false,
    menu: true
  },
  {
    name: 'rejected',
    primary_color: '#FF0000',
    addTask: false,
    menu: true
  }
];

export default KanbanColumns;

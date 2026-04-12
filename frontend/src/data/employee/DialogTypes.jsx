import { IconArchive, IconTrash } from '@tabler/icons-react';

const DialogTypes = [
  { id: 1, name: 'Delete', icon: <IconTrash size={20} /> },
  { id: 2, name: 'Archive', icon: <IconArchive size={20} color="grey" /> }
];

export default DialogTypes;

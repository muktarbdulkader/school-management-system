import { Storage } from 'configration/storage';

window.addEventListener('beforeunload', () => {
  Storage.clear();
});

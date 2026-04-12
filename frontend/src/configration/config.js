const config = {
  // Use environment variables for API URLs
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  API_URL_User_Create: import.meta.env.VITE_API_URL + '/api/' || 'http://localhost:8000/api/',
  API_URL_Role: import.meta.env.VITE_API_URL + '/api/' || 'http://localhost:8000/api/',
  API_URL_Privilage: import.meta.env.VITE_API_URL + '/api/' || 'http://localhost:8000/api/',
  API_URL_Units: import.meta.env.VITE_API_URL + '/api/' || 'http://localhost:8000/api/',
};

export const API_BASE_URL = config.API_URL;

export default config;

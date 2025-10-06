export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/v1',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    ME: '/me',
    CHANGE_PASSWORD: '/me/change-password',
    USERS: '/users',
    REFERENCES: {
      FORMS: '/references/forms',
      EVALUATIONS: '/references/evaluations',
      ALL: '/references/all',
      USERS_BY_ROLE: '/references/users'
    }
  }
};

// Para compatibilidad con código existente
export const API_BASE_URL = API_CONFIG.BASE_URL;

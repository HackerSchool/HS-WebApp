import api from './api';

export const login = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
}

export const logout = async () => {
  const response = await api.post('/logout');
  return response.data;
}

export const me = async () => {
  const response = await api.get('/me');
  return response.data;
}

export const fenixLogin = async () => {
  const response = await api.get('/fenix-login');
  return response.data;
}

export const fenixCallback = async (code) => {
  const response = await api.get(`/fenix-callback?code=${code}`);
  return response.data;
}


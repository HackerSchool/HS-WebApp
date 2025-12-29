import api from './api';

export const getMembers = async () => {
  const response = await api.get('/members');
  return response.data;
};

export const getMemberByUsername = async (username) => {
  const response = await api.get(`/members/${username}`);
  return response.data;
}

export const deleteMember = async (username) => {
  const response = await api.delete(`/members/${username}`);
  return response.data;
};

export const updateMember = async (username, newMember) => {
  const response = await api.put(`/members/${username}`, newMember);
  return response.data;
};

export const createMember = async (newMember) => {
  const response = await api.post(`/members`, newMember);
  return response.data;
}

export const uploadMemberImage = async (username, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/members/${username}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export const getMemberImage = async (username) => {
  const response = await api.get(`/members/${username}/image`, {
    responseType: 'blob',
  });
  return response.data;
}
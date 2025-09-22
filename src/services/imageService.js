import api from './api';

export const getMemberImage = async (username) => {
  const response = await api.get(`/members/${username}/image`);
  return response.data;
};

export const getProjectImage = async (slug) => {
  const response = await api.get(`/projects/${slug}/image`);
  return response.data;
}

export const uploadMemberImage = async (username, imageData) => {
  const response = await api.post(`/members/${username}/image`, imageData);
  return response.data;
}

export const uploadProjectImage = async (slug, imageData) => {
  const response = await api.post(`/projects/${slug}/image`, imageData);
  return response.data;
}

import api from './api';

export const createParticipation = async (slug, newParticipation) => {
  const response = await api.post(`/projects/${slug}/participations`, newParticipation);
  return response.data;
};

export const getParticipations = async (slug) => {
  const response = await api.get(`/projects/${slug}/participations`);
  return response.data;
}

export const getMemberParticipations = async (username) => {
  const response = await api.get(`/members/${username}/participations`);
  return response.data;
}

export const getParticipationByUsername = async (slug, username) => {
  const response = await api.get(`/projects/${slug}/participations/${username}`);
  return response.data;
}

export const updateParticipation = async (slug, username, newParticipation) => {
  const response = await api.put(`/projects/${slug}/participations/${username}`, newParticipation);
  return response.data;
}

export const deleteParticipation = async (slug, username) => {
  const response = await api.delete(`/projects/${slug}/participations/${username}`);
  return response.data;
}


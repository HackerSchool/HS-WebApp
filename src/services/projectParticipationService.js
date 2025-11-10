import api from './api';

/**
 * Project Participation Service
 * 
 * NOTE: These endpoints exist in the API code but are NOT documented in the official docs!
 * Source: API/app/controllers/project_participation_controller.py
 * 
 * Available endpoints:
 * ✅ POST /projects/<slug>/participations - Create participation
 * ✅ GET /projects/<slug>/participations - List all participations
 * ✅ GET /projects/<slug>/participations/<username> - Get specific participation
 * ✅ GET /members/<username>/participations - Get member's participations
 * ✅ PUT /projects/<slug>/participations/<username> - Update participation (roles, join_date)
 * ✅ DELETE /projects/<slug>/participations/<username> - Delete participation
 */

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

// Update participation - can change roles (participant ↔ coordinator) and join_date
export const updateParticipation = async (slug, username, newParticipation) => {
  const response = await api.put(`/projects/${slug}/participations/${username}`, newParticipation);
  return response.data;
}

// Delete participation - removes user from team
export const deleteParticipation = async (slug, username) => {
  const response = await api.delete(`/projects/${slug}/participations/${username}`);
  return response.data;
}


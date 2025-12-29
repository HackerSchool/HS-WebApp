import api from './api';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectBySlug = async (slug) => {
  const response = await api.get(`/projects/${slug}`);
  return response.data;
}

export const deleteProject = async (slug) => {
  const response = await api.delete(`/projects/${slug}`);
  return response.data;
};

export const updateProject = async (slug, newProject) => {
  const response = await api.put(`/projects/${slug}`, newProject);
  return response.data;
};

export const createProject = async (newProject) => {
  const response = await api.post(`/projects`, newProject);
  return response.data;
}

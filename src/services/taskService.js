import api from './api';

export const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const updateTask = async (taskId, newTask) => {
  const response = await api.put(`/tasks/${taskId}`, newTask);
  return response.data;
};

export const createTask = async (slug, newTask) => {
  const response = await api.post(`/projects/${slug}/tasks`, newTask);
  return response.data;
}

export const createTeamTask = async (slug, newTask) => {
  const response = await api.post(`/projects/${slug}/team-tasks`, newTask);
  return response.data;
}

export const getProjectTasks = async (slug) => {
  const response = await api.get(`/projects/${slug}/tasks`);
  return response.data;
}

export const getProjectTeamTasks = async (slug) => {
  const response = await api.get(`/projects/${slug}/team-tasks`);
  return response.data;
}

export const getMemberTasks = async (username) => {
  const response = await api.get(`/members/${username}/tasks`);
  return response.data;
}

export const getTeamTaskById = async (taskId) => {
  const response = await api.get(`/team-tasks/${taskId}`);
  return response.data;
};

export const updateTeamTask = async (taskId, newTask) => {
  const response = await api.put(`/team-tasks/${taskId}`, newTask);
  return response.data;
};

export const deleteTeamTask = async (taskId) => {
  const response = await api.delete(`/team-tasks/${taskId}`);
  return response.data;
};

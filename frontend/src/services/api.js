import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prism_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('prism_token');
      localStorage.removeItem('prism_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  getMe: () => api.get('/auth/me'),
};

export const githubAPI = {
  getRepos: () => api.get('/github/repos'),
  getPulls: (owner, repo) => api.get(`/github/repos/${owner}/${repo}/pulls`),
  getPullFiles: (owner, repo, pull_number) =>
    api.get(`/github/repos/${owner}/${repo}/pulls/${pull_number}/files`),
  getDiff: (owner, repo, pull_number) =>
    api.get(`/github/pulls/${owner}/${repo}/${pull_number}/diff`),
  postComment: (data) => api.post('/github/comment', data),
  analyzeRepo: (owner, repo) => api.get(`/github/repos/${owner}/${repo}/analyze`),
};

export const reviewAPI = {
  getHistory: () => api.get('/review/history'),
  getById: (id) => api.get(`/review/${id}`),
};

export default api;

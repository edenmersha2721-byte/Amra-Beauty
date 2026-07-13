import { api } from './client.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const serviceApi = {
  list: (params) => api.get('/services', { params }),
  get: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
};

export const categoryApi = {
  list: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const subcategoryApi = {
  list: (params) => api.get('/subcategories', { params }),
  create: (data) => api.post('/subcategories', data),
  remove: (id) => api.delete(`/subcategories/${id}`),
};

export const appointmentApi = {
  create: (data) => api.post('/appointments', data),
  mine: (params) => api.get('/appointments/mine', { params }),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  approveReschedule: (id) => api.put(`/appointments/${id}/reschedule/approve`),
  rejectReschedule: (id) => api.put(`/appointments/${id}/reschedule/reject`),
  list: (params) => api.get('/appointments', { params }),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
};

export const galleryApi = {
  list: (params) => api.get('/gallery', { params }),
  create: (formData) => api.post('/gallery', formData),
  remove: (id) => api.delete(`/gallery/${id}`),
};

export const promotionApi = {
  list: (params) => api.get('/promotions', { params }),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  remove: (id) => api.delete(`/promotions/${id}`),
};

export const reviewApi = {
  list: (params) => api.get('/reviews', { params }),
  mine: () => api.get('/reviews/mine'),
  create: (data) => api.post('/reviews', data),
  remove: (id) => api.delete(`/reviews/${id}`),
  all: () => api.get('/reviews/all'),
  update: (id, data) => api.put(`/reviews/${id}`, data),
};

export const contactApi = {
  send: (data) => api.post('/contact', data),
  list: () => api.get('/contact'),
  markRead: (id) => api.put(`/contact/${id}/read`),
  remove: (id) => api.delete(`/contact/${id}`),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  setStatus: (id, is_active) => api.put(`/customers/${id}/status`, { is_active }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

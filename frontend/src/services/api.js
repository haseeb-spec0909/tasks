import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const api = axios.create({
  baseURL: '/api',
})

/**
 * Auth interceptor - attach Firebase JWT token
 */
export const setupAuthInterceptor = (getToken) => {
  api.interceptors.request.use(async (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }, (error) => Promise.reject(error))

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 - redirect to login
      if (error.response?.status === 401) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

// Tasks
export const getTasks = (filters = {}) => 
  api.get('/tasks', { params: filters })

export const getTask = (id) => 
  api.get(`/tasks/${id}`)

export const createTask = (data) => 
  api.post('/tasks', data)

export const updateTask = (id, data) => 
  api.patch(`/tasks/${id}`, data)

export const completeTask = (id) => 
  api.post(`/tasks/${id}/complete`)

export const updateProgress = (id, data) => 
  api.patch(`/tasks/${id}/progress`, data)

// Calendar
export const getCalendarEvents = (startDate, endDate) => 
  api.get('/calendar/events', {
    params: { start: startDate, end: endDate },
  })

export const getFreeBusy = (startDate, endDate) => 
  api.get('/calendar/freebusy', {
    params: { start: startDate, end: endDate },
  })

export const triggerReschedule = (taskId) => 
  api.post(`/calendar/reschedule/${taskId}`)

// Habits
export const getHabits = () => 
  api.get('/habits')

export const createHabit = (data) => 
  api.post('/habits', data)

export const updateHabit = (id, data) => 
  api.patch(`/habits/${id}`, data)

export const logHabit = (id) => 
  api.post(`/habits/${id}/log`)

// Stats
export const getStats = () => 
  api.get('/stats/personal')

export const getTeamStats = () => 
  api.get('/stats/team')

export const getPfDeliveryHealth = () => 
  api.get('/stats/pf-delivery-health')

export const getCapacity = () => 
  api.get('/stats/capacity')

// Team
export const getTeamData = () => 
  api.get('/team')

export const getTeamMember = (id) => 
  api.get(`/team/${id}`)

// Settings
export const getSettings = () => 
  api.get('/settings')

export const updateSettings = (data) => 
  api.patch('/settings', data)

// User
export const getUserProfile = () => 
  api.get('/user/profile')

export const completeOnboarding = (data) => 
  api.post('/user/onboarding/complete', data)

export default api

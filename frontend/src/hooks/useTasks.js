import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as apiService from '../services/api'

const TASKS_QUERY_KEY = 'tasks'

/**
 * Hook to fetch tasks with filters
 */
export function useTasksQuery(filters = {}) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: () => apiService.getTasks(filters),
    select: (data) => data.data,
  })
}

/**
 * Hook to fetch a single task
 */
export function useTaskQuery(id) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, id],
    queryFn: () => apiService.getTask(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => apiService.createTask(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      return data.data
    },
    onError: (error) => {
      console.error('Failed to create task:', error)
    },
  })
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateTask(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.setQueryData([TASKS_QUERY_KEY, variables.id], data.data)
    },
    onError: (error) => {
      console.error('Failed to update task:', error)
    },
  })
}

/**
 * Hook to complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => apiService.completeTask(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.setQueryData([TASKS_QUERY_KEY, id], data.data)
    },
    onError: (error) => {
      console.error('Failed to complete task:', error)
    },
  })
}

/**
 * Hook to update task progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateProgress(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.setQueryData([TASKS_QUERY_KEY, variables.id], data.data)
    },
    onError: (error) => {
      console.error('Failed to update progress:', error)
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as apiService from '../services/api'

const CALENDAR_QUERY_KEY = 'calendar'

/**
 * Hook to fetch calendar events
 */
export function useCalendarEvents(startDate, endDate) {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, 'events', startDate, endDate],
    queryFn: () => apiService.getCalendarEvents(startDate, endDate),
    select: (data) => data.data,
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Hook to fetch free/busy information
 */
export function useFreeBusy(startDate, endDate) {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, 'freebusy', startDate, endDate],
    queryFn: () => apiService.getFreeBusy(startDate, endDate),
    select: (data) => data.data,
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Hook to trigger reschedule
 */
export function useReschedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId) => apiService.triggerReschedule(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      console.error('Failed to reschedule task:', error)
    },
  })
}

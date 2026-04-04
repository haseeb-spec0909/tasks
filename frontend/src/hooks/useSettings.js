import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as apiService from '../services/api'

const SETTINGS_QUERY_KEY = 'settings'

/**
 * Hook to fetch user settings
 */
export function useSettings() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: () => apiService.getSettings(),
    select: (data) => data.data,
  })
}

/**
 * Hook to update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => apiService.updateSettings(data),
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_QUERY_KEY], data.data)
    },
    onError: (error) => {
      console.error('Failed to update settings:', error)
    },
  })
}

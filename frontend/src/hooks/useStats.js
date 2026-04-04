import { useQuery } from '@tanstack/react-query'
import * as apiService from '../services/api'

const STATS_QUERY_KEY = 'stats'

/**
 * Hook to fetch personal stats
 */
export function usePersonalStats() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'personal'],
    queryFn: () => apiService.getStats(),
    select: (data) => data.data,
  })
}

/**
 * Hook to fetch team stats (manager only)
 */
export function useTeamStats() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'team'],
    queryFn: () => apiService.getTeamStats(),
    select: (data) => data.data,
  })
}

/**
 * Hook to fetch ProjectFlow delivery health
 */
export function usePfDeliveryHealth() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'pf-delivery-health'],
    queryFn: () => apiService.getPfDeliveryHealth(),
    select: (data) => data.data,
  })
}

/**
 * Hook to fetch capacity information
 */
export function useCapacity() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'capacity'],
    queryFn: () => apiService.getCapacity(),
    select: (data) => data.data,
  })
}

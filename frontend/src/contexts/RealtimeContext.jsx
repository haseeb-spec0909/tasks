import { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'

const RealtimeContext = createContext(null)

/**
 * RealtimeProvider component for SSE connection
 */
export function RealtimeProvider({ children }) {
  const { user } = useAuth()
  const eventSourceRef = useRef(null)
  const subscribersRef = useRef(new Map())

  // Connect to SSE stream
  useEffect(() => {
    if (!user) return

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(
          `/api/events/stream?token=${user.token}`
        )

        eventSource.addEventListener('schedule_updated', (event) => {
          const data = JSON.parse(event.data)
          notifySubscribers('schedule_updated', data)
        })

        eventSource.addEventListener('task_changed', (event) => {
          const data = JSON.parse(event.data)
          notifySubscribers('task_changed', data)
        })

        eventSource.addEventListener('notification', (event) => {
          const data = JSON.parse(event.data)
          notifySubscribers('notification', data)
        })

        eventSource.addEventListener('pf_sync_complete', (event) => {
          const data = JSON.parse(event.data)
          notifySubscribers('pf_sync_complete', data)
        })

        eventSource.onerror = () => {
          eventSource.close()
          eventSourceRef.current = null
          // Attempt reconnect after 5 seconds
          setTimeout(connectSSE, 5000)
        }

        eventSourceRef.current = eventSource
      } catch (error) {
        console.error('SSE connection error:', error)
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [user])

  const notifySubscribers = useCallback((eventType, data) => {
    const subscribers = subscribersRef.current.get(eventType) || []
    subscribers.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in event subscriber:', error)
      }
    })
  }, [])

  const subscribe = useCallback((eventType, callback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, [])
    }
    subscribersRef.current.get(eventType).push(callback)

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(eventType) || []
      const index = subscribers.indexOf(callback)
      if (index > -1) {
        subscribers.splice(index, 1)
      }
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

/**
 * useRealtime hook
 */
export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

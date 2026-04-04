import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import { setupAuthInterceptor } from './services/api'
import PlannerView from './components/Planner/PlannerView'
import TaskListView from './components/TaskEngine/TaskListView'
import PriorityBoardView from './components/PriorityBoard/PriorityBoardView'
import FocusTimeView from './components/FocusTime/FocusTimeView'
import HabitsView from './components/Habits/HabitsView'
import StatsView from './components/Stats/StatsView'
import TeamDashboardView from './components/TeamDashboard/TeamDashboardView'
import SettingsView from './components/Settings/SettingsView'
import OnboardingWizard from './components/Onboarding/OnboardingWizard'
import LoginPage from './components/common/LoginPage'

/**
 * ProtectedRoute wrapper to check authentication
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Routes component
 */
function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PlannerView />} />
        <Route path="/tasks" element={<TaskListView />} />
        <Route path="/priorities" element={<PriorityBoardView />} />
        <Route path="/focus" element={<FocusTimeView />} />
        <Route path="/habits" element={<HabitsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/team" element={<TeamDashboardView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

/**
 * Main App component
 */
function App() {
  useEffect(() => {
    setupAuthInterceptor(() => {
      // Get current token from auth context
      const token = localStorage.getItem('authToken')
      return token
    })
  }, [])

  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppRoutes />
      </RealtimeProvider>
    </AuthProvider>
  )
}

export default App

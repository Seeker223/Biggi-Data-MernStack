import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user } = useAuth()
  
  // For now, always allow access - we'll add real auth later
  // return user ? <Outlet /> : <Navigate to="/login" replace />
  
  return <Outlet /> // Temporary - allow all access
}
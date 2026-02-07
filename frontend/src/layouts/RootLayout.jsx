import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  )
}
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
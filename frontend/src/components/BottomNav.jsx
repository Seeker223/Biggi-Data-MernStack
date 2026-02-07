import { HomeIcon, UserIcon, CurrencyDollarIcon, CogIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        <Link to="/dashboard" className="flex flex-col items-center p-2 text-gray-600 hover:text-primary">
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link to="/transactions" className="flex flex-col items-center p-2 text-gray-600 hover:text-primary">
          <CurrencyDollarIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Transactions</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center p-2 text-gray-600 hover:text-primary">
          <UserIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center p-2 text-gray-600 hover:text-primary">
          <CogIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </div>
  )
}
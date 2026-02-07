export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-primary">Biggi Data</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
              <a href="/profile" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Profile</a>
              <a href="/transactions" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Transactions</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
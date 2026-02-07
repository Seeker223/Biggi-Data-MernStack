import { Link } from 'react-router-dom'

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
        <p className="mt-4 text-gray-600">Sign up page coming soon...</p>
        <Link to="/login" className="mt-4 inline-block text-primary hover:text-primary/80">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
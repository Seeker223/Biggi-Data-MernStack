import { useEffect, useState } from 'react'
import { testBackendConnection } from '../services/api'

export default function TestAPI() {
  const [status, setStatus] = useState('Testing...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await testBackendConnection()
        setStatus(isConnected ? '✅ Connected to backend' : '❌ Backend unreachable')
      } catch (error) {
        setStatus('❌ Connection failed')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <p className="text-sm font-medium">
        API Status: {loading ? 'Testing...' : status}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {import.meta.env.VITE_BASE_URL || 'No base URL set'}
      </p>
    </div>
  )
}
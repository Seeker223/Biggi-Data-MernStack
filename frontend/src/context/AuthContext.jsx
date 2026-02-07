import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  
  // Mock login function
  const login = async (email, password) => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (email && password) {
          setUser({ email, name: "Demo User", username: "Demo User" })
          resolve({ success: true, user: { email, name: "Demo User" } })
        } else {
          resolve({ success: false, error: "Invalid credentials" })
        }
      }, 1000)
    })
  }
  
  // Mock register function
  const register = async (username, email, password, phoneNumber, birthDate) => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (username && email && password) {
          setUser({ username, email, phoneNumber, birthDate })
          resolve({ success: true, user: { username, email } })
        } else {
          resolve({ success: false, error: "Registration failed" })
        }
      }, 1000)
    })
  }
  
  const logout = () => {
    setUser(null)
  }
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
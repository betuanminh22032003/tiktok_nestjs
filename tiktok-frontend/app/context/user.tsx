'use client'

import { apiClient } from '@/libs/api-client'
import { useRouter } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { User, UserContextTypes } from '../types'

const UserContext = createContext<UserContextTypes | null>(null)

const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  const checkUser = async () => {
    try {
      // Check if user is authenticated via cookies (HttpOnly)
      // The backend sets cookies automatically
      const response = (await apiClient.get('api/auth/me')) as any

      if (response && response.id) {
        setUser({
          id: response.id,
          name: response.username || response.fullName || '',
          bio: response.bio || '',
          image: response.avatar || '',
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = (await apiClient.register({ username: name, email, password })) as any

      // Cookies are set by backend automatically (HttpOnly)
      // Response contains user data and tokens
      if (response.success && response.data?.user) {
        const userData = response.data.user
        setUser({
          id: userData.id,
          name: userData.username || userData.fullName || '',
          bio: userData.bio || '',
          image: userData.avatar || '',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Backend expects 'username' field, but we can use email as username
      const response = (await apiClient.login({ username: email, password })) as any

      // Cookies are set by backend automatically (HttpOnly)
      // Response contains user data and tokens
      if (response.success && response.data?.user) {
        const userData = response.data.user
        setUser({
          id: userData.id,
          name: userData.username || userData.fullName || '',
          bio: userData.bio || '',
          image: userData.avatar || '',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
      // Cookies are cleared by backend
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error(error)
      // Clear user even if API call fails
      setUser(null)
      router.push('/')
    }
  }

  return (
    <UserContext.Provider value={{ user, register, login, logout, checkUser }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider

export const useUser = () => useContext(UserContext)

import { getIronSession } from 'iron-session'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { User, Session } from '@/types'

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'dashboard-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'strict' as const,
  },
}

export async function getSession(req?: NextRequest, res?: NextResponse) {
  if (req && res) {
    return getIronSession<Session>(req, res, sessionOptions)
  }
  
  const session = await getIronSession<Session>(cookies(), sessionOptions)
  return session
}

export function getAuthorizedUsers(): Record<string, string> {
  const usersString = process.env.AUTHORIZED_USERS || ''
  const users: Record<string, string> = {}
  
  if (usersString) {
    const userPairs = usersString.split(',')
    for (const pair of userPairs) {
      const [username, password] = pair.split(':')
      if (username && password) {
        users[username.trim()] = password.trim()
      }
    }
  }
  
  return users
}

export function validateCredentials(username: string, password: string): User | null {
  const users = getAuthorizedUsers()
  
  if (users[username] && users[username] === password) {
    return {
      username,
      role: username === 'admin' ? 'admin' : 'user',
    }
  }
  
  return null
}

export async function login(username: string, password: string): Promise<boolean> {
  const user = validateCredentials(username, password)
  
  if (!user) {
    return false
  }
  
  const session = await getSession()
  session.user = user
  session.isLoggedIn = true
  session.loginTime = new Date()
  
  await session.save()
  return true
}

export async function logout() {
  const session = await getSession()
  session.destroy()
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session.isLoggedIn === true
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session.isLoggedIn ? session.user : null
}
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <ShieldX className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access the Super Admin Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Super Admin privileges are required to access this area.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact an administrator if you believe this is an error.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

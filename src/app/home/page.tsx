'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Settings, LogIn, LayoutDashboard, Users, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <LayoutDashboard className="h-8 w-8" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground mb-2">FahamPesa Admin</h1>
          <p className="text-muted-foreground text-lg">
            Super Admin Dashboard for FahamPesa Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateTo('/setup-admin')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Setup Super Admin
                </CardTitle>
                <CardDescription>
                  Create the initial super admin user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up the first super admin account with full access to the dashboard.
                </p>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Setup Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateTo('/login')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Admin Login
                </CardTitle>
                <CardDescription>
                  Sign in to access the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your admin credentials to access the super admin dashboard.
                </p>
                <Button variant="outline" className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateTo('/super-admin')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Super Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Access the full admin dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive analytics, user management, and platform controls.
                </p>
                <Button variant="secondary" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Quick Setup Guide
              </CardTitle>
              <CardDescription>
                Get started with the FahamPesa Super Admin Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">1. Setup Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Create the initial super admin user account
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">2. Login</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in with your admin credentials
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">3. Manage</h3>
                  <p className="text-sm text-muted-foreground">
                    Access comprehensive platform analytics and controls
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

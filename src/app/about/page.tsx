'use client'

import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'
import Footer from '@/components/footer'
import { AboutContent } from '@/components/about/AboutContent'
import PageHeader from '@/components/PageHeader'
import PublicHeader from '@/components/public-header'

export default function AboutPage() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f8f9] font-dm-sans">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      <PublicHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      <main>
        <PageHeader title="About Us" />
        <AboutContent />
      </main>

      <Footer />
    </div>
  )
}

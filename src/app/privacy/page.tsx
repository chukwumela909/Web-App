'use client'

import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'
import Footer from '@/components/footer'
import { PrivacyContent } from '@/components/privacy/PrivacyContent'
import PageHeader from '@/components/PageHeader'
import PublicHeader from '@/components/public-header'

export default function PrivacyPage() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f8f9] font-dm-sans">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      <PublicHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      <main>
        <PageHeader title="Privacy Policy" />
        <PrivacyContent />
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'
import Footer from '@/components/footer'
import PageHeader from '@/components/PageHeader'
import PublicHeader from '@/components/public-header'
import { TermsContent } from '@/components/terms/TermsContent'

export default function TermsPage() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f8f9] font-dm-sans">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      <PublicHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      <main>
        <PageHeader title="Terms of Service" />
        <TermsContent />
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'
import Footer from '@/components/footer'
import PublicHeader from '@/components/public-header'
import PageHeader from '@/components/PageHeader'
import { ContactInformationContent } from '@/components/contact/ContactInformationContent'

export default function ContactInformationPage() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-dm-sans">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      <PublicHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      <main>
        <PageHeader title="Contact Information" />
        <ContactInformationContent />
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'
import Footer from '@/components/footer'
import PageHeader from '@/components/PageHeader'
import PublicHeader from '@/components/public-header'
import Image from 'next/image'
import { Monitor, Search, Download, MousePointerClick, ShieldCheck, Rocket, ArrowRight, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Open the Microsoft Store',
    description:
      'On your Windows PC, click the Start menu and search for "Microsoft Store", then open it. You can also click the Microsoft Store icon if it\'s pinned to your taskbar.',
  },
  {
    number: 2,
    icon: MousePointerClick,
    title: 'Search for FahamPesa',
    description:
      'In the Microsoft Store search bar at the top, type "FahamPesa" and press Enter. Select FahamPesa from the search results.',
  },
  {
    number: 3,
    icon: Download,
    title: 'Install the App',
    description:
      'Click the "Get" or "Install" button on the FahamPesa app page. The app will begin downloading and installing automatically. Wait for the installation to complete.',
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Launch FahamPesa',
    description:
      'Once installed, click "Open" in the Microsoft Store, or find FahamPesa in your Start menu. The app is now ready to use!',
  },
]

const requirements = [
  'Windows 10 version 17763.0 or higher',
  'x64 or ARM64 architecture',
  'Active internet connection for initial setup',
  'At least 200 MB of available storage',
]

const faqs = [
  {
    question: 'Is FahamPesa free to download from the Microsoft Store?',
    answer:
      'Yes, FahamPesa is free to download. You can choose a subscription plan after installation to unlock premium features.',
  },
  {
    question: 'Do I need a Microsoft account to install the app?',
    answer:
      'Yes, you need to be signed into a Microsoft account to download apps from the Microsoft Store.',
  },
  {
    question: 'The app isn\'t showing up in the Microsoft Store. What should I do?',
    answer:
      'Make sure your Windows version is up to date. You can also try the direct link provided above to open the app page directly in the Store.',
  },
  {
    question: 'How do I update FahamPesa?',
    answer:
      'The Microsoft Store handles updates automatically. You can also open the Store, go to "Library", and click "Get updates" to check for the latest version.',
  },
  {
    question: 'Can I install FahamPesa on multiple devices?',
    answer:
      'Yes, once you\'ve downloaded it from the Microsoft Store, you can install it on up to 10 Windows devices signed in with the same Microsoft account.',
  },
]

export default function InstallationPage() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#f8f8f9] font-dm-sans">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      <PublicHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      <main>
        <PageHeader title="Installation Guide" />

        {/* Intro Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#E6F0FF] text-[#004AAD] px-4 py-2 rounded-full text-[14px] font-medium mb-6">
              <Monitor className="w-4 h-4" />
              Available on Windows
            </div>
            <h2 className="text-[#001031] text-[28px] sm:text-[36px] font-semibold font-archivo leading-tight mb-4">
              Get FahamPesa from the Microsoft Store
            </h2>
            <p className="text-[#64748b] text-[16px] sm:text-[18px] leading-relaxed mb-8">
              Install FahamPesa directly from the Microsoft Store for the easiest and most secure
              setup experience. Follow the steps below to get started in minutes.
            </p>
            <a
              href="https://apps.microsoft.com/search?query=fahampesa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#004AAD] hover:bg-[#003a8c] text-white px-6 py-3 rounded-[12px] text-[16px] font-medium transition-colors"
            >
              Open in Microsoft Store
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Steps Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] pb-12 lg:pb-20">
          <h3 className="text-[#001031] text-[24px] sm:text-[30px] font-semibold font-archivo text-center mb-12">
            Step-by-Step Installation
          </h3>

          <div className="max-w-3xl mx-auto space-y-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="bg-white border border-gray-100 rounded-[16px] p-6 sm:p-8 flex gap-5 items-start shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#004AAD] text-white flex items-center justify-center text-[18px] font-semibold">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-[#004AAD]" />
                      <h4 className="text-[#001031] text-[18px] sm:text-[20px] font-semibold">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-[#64748b] text-[15px] sm:text-[16px] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* System Requirements */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] py-12 lg:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-[10px] bg-[#E6F0FF] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#004AAD]" />
                </div>
                <h3 className="text-[#001031] text-[24px] sm:text-[30px] font-semibold font-archivo">
                  System Requirements
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {requirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-[#f8f8f9] rounded-[12px] p-4"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#004AAD] flex-shrink-0 mt-0.5" />
                    <span className="text-[#001031] text-[15px]">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started After Install */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] py-12 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-[#001031] text-[24px] sm:text-[30px] font-semibold font-archivo text-center mb-12">
              Getting Started After Installation
            </h3>

            <div className="space-y-6">
              <div className="bg-white border border-gray-100 rounded-[16px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[14px] font-semibold text-[#004AAD]">
                    1
                  </div>
                  <div>
                    <h4 className="text-[#001031] text-[18px] font-semibold mb-2">
                      Create Your Account
                    </h4>
                    <p className="text-[#64748b] text-[15px] leading-relaxed">
                      Open FahamPesa and sign up with your email address or phone number. You&apos;ll
                      need to verify your account before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-[#004AAD] rotate-90" />
              </div>

              <div className="bg-white border border-gray-100 rounded-[16px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[14px] font-semibold text-[#004AAD]">
                    2
                  </div>
                  <div>
                    <h4 className="text-[#001031] text-[18px] font-semibold mb-2">
                      Set Up Your Business
                    </h4>
                    <p className="text-[#64748b] text-[15px] leading-relaxed">
                      Complete the onboarding process by entering your business name, selecting your
                      industry, and configuring your currency preferences.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-[#004AAD] rotate-90" />
              </div>

              <div className="bg-white border border-gray-100 rounded-[16px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[14px] font-semibold text-[#004AAD]">
                    3
                  </div>
                  <div>
                    <h4 className="text-[#001031] text-[18px] font-semibold mb-2">
                      Add Your Products
                    </h4>
                    <p className="text-[#64748b] text-[15px] leading-relaxed">
                      Navigate to the Products section to add your inventory. You can add items
                      individually or import them in bulk to get started quickly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-[#004AAD] rotate-90" />
              </div>

              <div className="bg-white border border-gray-100 rounded-[16px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[14px] font-semibold text-[#004AAD]">
                    4
                  </div>
                  <div>
                    <h4 className="text-[#001031] text-[18px] font-semibold mb-2">
                      Start Selling
                    </h4>
                    <p className="text-[#64748b] text-[15px] leading-relaxed">
                      You&apos;re all set! Head to the Dashboard to make your first sale, track
                      inventory, and monitor your business performance in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] py-12 lg:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-[10px] bg-[#E6F0FF] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#004AAD]" />
                </div>
                <h3 className="text-[#001031] text-[24px] sm:text-[30px] font-semibold font-archivo">
                  Frequently Asked Questions
                </h3>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-[12px] overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-[#f8f8f9] transition-colors"
                    >
                      <span className="text-[#001031] text-[15px] sm:text-[16px] font-medium pr-4">
                        {faq.question}
                      </span>
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full border border-[#004AAD] flex items-center justify-center text-[#004AAD] transition-transform ${
                          openFaq === i ? 'rotate-45' : ''
                        }`}
                      >
                        +
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-5">
                        <p className="text-[#64748b] text-[15px] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] py-12 lg:py-20">
          <div className="max-w-3xl mx-auto text-center bg-[#001031] rounded-[24px] p-8 sm:p-12">
            <h3 className="text-white text-[24px] sm:text-[30px] font-semibold font-archivo mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-[#94a3b8] text-[16px] leading-relaxed mb-8">
              Download FahamPesa from the Microsoft Store and start managing your business today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://apps.microsoft.com/search?query=fahampesa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#004AAD] hover:bg-[#003a8c] text-white px-6 py-3 rounded-[12px] text-[16px] font-medium transition-colors"
              >
                <Image
                  src="/assets/download-modal/windows-icon.svg"
                  alt=""
                  width={20}
                  height={20}
                />
                Get from Microsoft Store
              </a>
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded-[12px] text-[16px] font-medium transition-colors"
              >
                Other Platforms
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

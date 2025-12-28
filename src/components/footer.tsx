import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#001223] text-white py-16 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-[100px]">
        <div className="grid md:grid-cols-3 gap-12 mb-[100px]">
          {/* COMPANY */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[20px] font-semibold text-[#64748b] font-dm-sans tracking-wide">COMPANY</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Legal
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* HELP */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[20px] font-semibold text-[#64748b] font-dm-sans tracking-wide">HELP</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  WhatsApp Support
                </Link>
              </li>
              <li>
                <a href="mailto:support@fahampesa.com" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  support@fahampesa.com
                </a>
              </li>
            </ul>
          </div>

          {/* GET THE APP */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[20px] font-semibold text-[#64748b] font-dm-sans tracking-wide">GET THE APP</h3>
            <ul className="flex flex-col gap-4 mb-4">
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Desktop for Windows
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[18px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Desktop for Mac
                </Link>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-[166px] h-[48px] hover:opacity-90 transition-opacity cursor-pointer">
                <Image 
                  src="https://www.figma.com/api/mcp/asset/857eef64-c95f-4261-b645-28da8574d939" 
                  alt="Get it on Google Play" 
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative w-[166px] h-[48px] hover:opacity-90 transition-opacity cursor-pointer">
                <Image 
                  src="https://www.figma.com/api/mcp/asset/0f2fc24a-bc49-4daa-9adc-485f5355fae3" 
                  alt="Download on the App Store" 
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[16px] font-medium text-white font-dm-sans text-center md:text-left">
            Copyright © 2026 Fahampesa - All Rights Reserved
          </p>
          <div className="flex gap-4">
            <div className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <Facebook className="w-5 h-5 text-[#001223] fill-[#001223] group-hover:scale-110 transition-transform" />
            </div>
            <div className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <div className="w-5 h-5 flex items-center justify-center">
                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#001223] fill-current group-hover:scale-110 transition-transform" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                 </svg>
              </div>
            </div>
            <div className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <Instagram className="w-5 h-5 text-[#001223] group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

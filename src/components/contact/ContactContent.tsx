import React from 'react'
import Link from 'next/link'

export const ContactContent = () => {
  return (
    <div className="bg-white w-full flex justify-center py-10 lg:py-20">
      <div className="max-w-[946px] w-full px-6 lg:px-0 relative flex flex-col items-center text-center">
        
        {/* Title inside the content area as per design, although we might have a Hero above. 
            The design shows "Contact Information" at top-[60px] inside this white section.
            If I put a Hero above, I might remove this, or keep it if the Hero is different.
            For now, I'll follow the design strictly which has this title inside the white section.
        */}
        <h1 className="font-archivo font-semibold text-[#191d23] text-[36px] leading-[normal] mb-8 text-center">
          Contact Information
        </h1>

        <div className="font-archivo text-[#191d23] text-[16px] leading-[20px] w-full text-center space-y-6">
          
          <div className="space-y-1">
            <p className="font-bold mb-0">Business Name</p>
            <p className="mb-0">Fahampesa</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Business Category</p>
            <p className="mb-0">Financial Services</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Business Description</p>
            <p className="mb-0 max-w-[800px] mx-auto">
              Fahampesa is a professional POS and business management platform that helps businesses reduce losses and gain clear control over sales, inventory, and profit. Built for reliability, offline use, and long term growth.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Business Hours</p>
            <p className="mb-0">Sunday to Saturday</p>
            <p className="mb-0">9:00 AM to 6:00 PM</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Website</p>
            <Link href="https://fahampesa.com" target="_blank" className="text-[#191d23] hover:text-[#004aad] transition-colors">
              https://fahampesa.com
            </Link>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Social Media</p>
            <p className="mb-0">
              Instagram: <Link href="https://www.instagram.com/fahampesa" target="_blank" className="hover:text-[#004aad] transition-colors">https://www.instagram.com/fahampesa</Link>
            </p>
            <p className="mb-0">
              Facebook: <Link href="https://www.facebook.com/fahampesa" target="_blank" className="hover:text-[#004aad] transition-colors">https://www.facebook.com/fahampesa</Link>
            </p>
            <p className="mb-0">
              TikTok: <Link href="https://www.tiktok.com/@fahampesa" target="_blank" className="hover:text-[#004aad] transition-colors">https://www.tiktok.com/@fahampesa</Link>
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Contact Details</p>
            <p className="mb-0">
              Email: <a href="mailto:info@fahampesa.com" className="hover:text-[#004aad] transition-colors">info@fahampesa.com</a>
            </p>
            <p className="mb-0">
              Phone: <a href="tel:+254117159912" className="hover:text-[#004aad] transition-colors">+254 117 159 912</a>
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold mb-0">Support</p>
            <p className="mb-0">
              For support, sales, or partnership inquiries, contact us through the email or phone number above.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

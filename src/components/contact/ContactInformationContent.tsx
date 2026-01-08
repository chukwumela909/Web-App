'use client'

import React from 'react';

export function ContactInformationContent() {
  return (
    <div className="relative w-full max-w-[1440px] mx-auto bg-white py-16 px-6 lg:px-[100px] min-h-[60vh]">
      <h1 className="font-archivo font-semibold text-[36px] text-[#191d23] mb-12 lg:mb-[60px]">
        Contact Information
      </h1>

      <div className="font-archivo text-[16px] text-[#191d23] leading-[24px] max-w-[946px] space-y-8">
        <div>
          <p className="font-bold mb-1">Business Name</p>
          <p>Fahampesa</p>
        </div>

        <div>
          <p className="font-bold mb-1">Business Category</p>
          <p>Financial Services</p>
        </div>

        <div>
           <p className="font-bold mb-1">Business Description</p>
           <p>Fahampesa is a professional POS and business management platform that helps businesses reduce losses and gain clear control over sales, inventory, and profit. Built for reliability, offline use, and long term growth.</p>
        </div>

        <div>
          <p className="font-bold mb-1">Business Hours</p>
          <p>Sunday to Saturday</p>
          <p>9:00 AM to 6:00 PM</p>
        </div>

        <div>
          <p className="font-bold mb-1">Website</p>
          <p><a href="https://fahampesa.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#004aad]">https://fahampesa.com</a></p>
        </div>

        <div>
          <p className="font-bold mb-1">Social Media</p>
          <p>Instagram: <a href="https://www.instagram.com/fahampesa" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#004aad]">https://www.instagram.com/fahampesa</a></p>
          <p>Facebook: <a href="https://www.facebook.com/fahampesa" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#004aad]">https://www.facebook.com/fahampesa</a></p>
          <p>TikTok: <a href="https://www.tiktok.com/@fahampesa" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#004aad]">https://www.tiktok.com/@fahampesa</a></p>
        </div>

        <div>
          <p className="font-bold mb-1">Contact Details</p>
          <p>Email: <a href="mailto:info@fahampesa.com" className="hover:underline text-[#004aad]">info@fahampesa.com</a></p>
          <p>Phone: +254 117 159 912</p>
        </div>

        <div>
          <p className="font-bold mb-1">Support</p>
          <p>For support, sales, or partnership inquiries, contact us through the email or phone number above.</p>
        </div>
      </div>
    </div>
  );
}

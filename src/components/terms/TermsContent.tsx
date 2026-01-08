'use client'

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const navItems = [
  { id: 'service-overview', title: 'Service Overview' },
  { id: 'account-registration', title: 'Account Registration' },
  { id: 'permitted-use', title: 'Permitted Use' },
  { id: 'prohibited-use', title: 'Prohibited Use' },
  { id: 'subscriptions-and-payments', title: 'Subscriptions and Payments' },
  { id: 'data-and-ownership', title: 'Data and Ownership' },
  { id: 'service-availability', title: 'Service Availability' },
  { id: 'support-and-communication', title: 'Support and Communication' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'suspension-and-termination', title: 'Suspension and Termination' },
  { id: 'limitation-of-liability', title: 'Limitation of Liability' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'updates-to-terms', title: 'Updates to Terms' },
];

export function TermsContent() {
  const [activeSection, setActiveSection] = useState(navItems[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(item.id);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative w-full max-w-[1440px] mx-auto bg-white py-16 px-6 lg:px-[100px]">
      <h1 className="font-archivo font-semibold text-[36px] text-[#191d23] mb-12 lg:mb-[60px]">
        Terms of Service
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Main Content */}
        <div className="flex-1 font-archivo text-[16px] text-[#191d23] leading-[24px]">
          <div className="space-y-6 mb-12">
            <p>These Terms of Service govern access to and use of the Fahampesa platform.</p>
            <p>By creating an account or using Fahampesa, you agree to these terms.</p>
          </div>

          <div id="service-overview" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">SERVICE OVERVIEW</h3>
            <div className="space-y-2">
              <p>Fahampesa provides business management software, including point of sale, inventory tracking,</p>
              <p>and reporting tools.</p>
              <br />
              <p>Features and availability depend on the selected plan and supported devices.</p>
            </div>
          </div>

          <div id="account-registration" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">ACCOUNT REGISTRATION</h3>
            <div className="space-y-2">
              <p>Users must provide accurate and current information during registration.</p>
              <p>You are responsible for maintaining the confidentiality of your login credentials.</p>
              <p>All activity performed under your account remains your responsibility.</p>
            </div>
          </div>

          <div id="permitted-use" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">PERMITTED USE</h3>
            <div className="space-y-2">
              <p>Fahampesa is intended for lawful business operations only.</p>
              <p>You agree to use the platform in compliance with applicable laws and regulations.</p>
            </div>
          </div>

          <div id="prohibited-use" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">PROHIBITED USE</h3>
            <div className="space-y-2">
              <p>You agree not to:</p>
              <br/>
              <ul className="list-none space-y-2">
                <li>• Use the platform for illegal or fraudulent activity.</li>
                <li>• Attempt unauthorized access to systems or data.</li>
                <li>• Interfere with platform security or performance.</li>
                <li>• Reverse engineer or copy the software.</li>
                <li>• Misuse the platform in a way that harms Fahampesa or other users.</li>
              </ul>
            </div>
          </div>

          <div id="subscriptions-and-payments" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">SUBSCRIPTIONS AND PAYMENTS</h3>
            <div className="space-y-2">
              <p>Some features require a paid subscription.</p>
              <p>Pricing and billing details are presented before purchase.</p>
              <p>Payments are processed by authorized third party providers.</p>
              <p>Failure to complete payment may result in restricted access.</p>
            </div>
          </div>

          <div id="data-and-ownership" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">DATA AND OWNERSHIP</h3>
            <div className="space-y-2">
              <p>Users retain ownership of all business data entered into Fahampesa.</p>
              <p>Fahampesa processes data solely to deliver and improve the service.</p>
              <p>Users are responsible for the accuracy of their data.</p>
            </div>
          </div>

          <div id="service-availability" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">SERVICE AVAILABILITY</h3>
            <div className="space-y-2">
              <p>Fahampesa aims to provide reliable access to the platform.</p>
              <p>Performance depends on device conditions and internet connectivity.</p>
              <p>Offline functionality operates based on system configuration.</p>
            </div>
          </div>

          <div id="support-and-communication" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">SUPPORT AND COMMUNICATION</h3>
            <div className="space-y-2">
              <p>Support is provided through official Fahampesa channels.</p>
              <p>Service related communications may be sent regarding updates, security, or account activity.</p>
            </div>
          </div>

          <div id="intellectual-property" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">INTELLECTUAL PROPERTY</h3>
            <div className="space-y-2">
              <p>All software, trademarks, designs, and platform content are owned by Fahampesa.</p>
              <p>No rights are granted except those required to use the service.</p>
            </div>
          </div>

          <div id="suspension-and-termination" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">SUSPENSION AND TERMINATION</h3>
            <div className="space-y-2">
              <p>Fahampesa may suspend or terminate accounts that violate these terms.</p>
              <p>Users may stop using the service at any time.</p>
              <p>Termination does not remove payment obligations already incurred.</p>
            </div>
          </div>

          <div id="limitation-of-liability" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">LIMITATION OF LIABILITY</h3>
            <div className="space-y-2">
              <p>Fahampesa provides tools and systems only.</p>
              <p>Business decisions and outcomes remain the responsibility of the user.</p>
              <p>Fahampesa is not liable for indirect losses resulting from platform use.</p>
            </div>
          </div>

          <div id="governing-law" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">GOVERNING LAW</h3>
            <div className="space-y-2">
              <p>These terms are governed by applicable laws in regions where Fahampesa operates.</p>
            </div>
          </div>

          <div id="updates-to-terms" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">UPDATES TO TERMS</h3>
            <div className="space-y-2">
              <p>These terms may be updated periodically.</p>
              <p>Continued use of the platform indicates acceptance of updated terms.</p>
            </div>
          </div>

          <div className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">CONTACT US</h3>
            <div className="space-y-2">
              <p>Please contact our support team with any questions or concerns regarding this Terms of Service at <a href="mailto:support@fahampesa.com" className="text-[#004aad] hover:underline">support@fahampesa.com</a></p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-[120px] flex gap-6">
            {/* Timeline Line */}
            <div className="relative w-[2px] bg-[#f2f2f2] rounded-full h-[calc(100vh-240px)] max-h-[500px]">
              <div 
                className="absolute w-[2px] h-[40px] bg-[#191d23] rounded-full transition-all duration-300 ease-in-out"
                style={{
                  top: `${Math.min(navItems.findIndex(item => item.id === activeSection) * 38, 460)}px`
                }}
              />
            </div>

            {/* Links */}
            <div className="flex flex-col gap-[18px]">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "text-[18px] text-left transition-colors duration-200 h-[20px] leading-[20px] font-archivo truncate w-full",
                    activeSection === item.id ? "text-[#191d23] font-medium" : "text-[#9b9797]"
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

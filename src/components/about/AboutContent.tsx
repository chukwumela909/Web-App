'use client'

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const navItems = [
  { id: 'why-exists', title: 'Why Fahampesa Exists' },
  { id: 'what-we-do', title: 'What We Do' },
  { id: 'who-we-serve', title: 'Who We Serve' },
  { id: 'our-approach', title: 'Our Approach' },
  { id: 'our-mission', title: 'Our Mission' },
  { id: 'built-for-growth', title: 'Built For Growth' },
  { id: 'our-commitment', title: 'Our Commitment' },
];

export function AboutContent() {
  const [activeSection, setActiveSection] = useState('why-exists');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header

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
        About Fahampesa
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Main Content */}
        <div className="flex-1 font-archivo text-[16px] text-[#191d23] leading-[24px]">
          <div className="space-y-6 mb-12">
            <p>Fahampesa is a business operations platform built for growing enterprises.</p>
            <p>We design professional tools for businesses that need accuracy, control, and reliability in daily operations.</p>
          </div>

          <div id="why-exists" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">WHY FAHAMPESA EXISTS</h3>
            <div className="space-y-2">
              <p>Many businesses lose money without realizing it.</p>
              <p>Stock goes missing.</p>
              <p>Records stay incomplete.</p>
              <p>Decisions rely on guesswork.</p>
              <br />
              <p>Fahampesa exists to replace uncertainty with clarity.</p>
              <br />
              <p>We give business owners real visibility into sales, inventory, and performance.</p>
              <p>We help teams stay accountable.</p>
              <p>We help businesses grow with structure, not chaos.</p>
            </div>
          </div>

          <div id="what-we-do" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">WHAT WE DO</h3>
            <div className="space-y-2">
              <p>Fahampesa provides modern business software designed for real operating environments.</p>
              <br />
              <ul className="list-none space-y-2">
                <li>• Point of sale and transaction tracking.</li>
                <li>• Inventory and stock control.</li>
                <li>• Sales and profit visibility.</li>
                <li>• Offline operation with secure data sync.</li>
                <li>• Tools built for long term scalability.</li>
              </ul>
              <br />
              <p>Every feature serves one goal.</p>
              <p>Protect business value.</p>
            </div>
          </div>

          <div id="who-we-serve" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">WHO WE SERVE</h3>
            <div className="space-y-2">
              <p>Fahampesa serves businesses across retail, wholesale, services, and distribution.</p>
              <p>Our users include:</p>
              <br />
              <ul className="list-none space-y-2">
                <li>• Small and medium retailers.</li>
                <li>• Wholesalers and distributors.</li>
                <li>• Pharmacies and high value stock businesses.</li>
                <li>• Service based businesses.</li>
                <li>• Multi branch operations preparing to scale.</li>
              </ul>
              <br />
              <p>We build for businesses that take operations seriously.</p>
            </div>
          </div>

          <div id="our-approach" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">OUR APPROACH</h3>
            <div className="space-y-2">
              <p>We build with discipline.</p>
              <p>We prioritize reliability over noise.</p>
              <p>We design for environments with limited connectivity.</p>
              <p>We focus on outcomes, not feature overload.</p>
              <p>Fahampesa is practical by design.</p>
              <p>Professional by standard.</p>
            </div>
          </div>

          <div id="our-mission" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">OUR MISSION</h3>
            <div className="space-y-2">
              <p>To help businesses operate with confidence.</p>
              <p>To reduce avoidable losses.</p>
              <p>To give owners control over profit and growth.We believe strong systems build strong businesses.</p>
            </div>
          </div>

          <div id="built-for-growth" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">BUILT FOR GROWTH</h3>
            <div className="space-y-2">
              <p>Fahampesa supports businesses from early stages to advanced operations.</p>
              <ul className="list-none space-y-2 mt-2">
                <li>• Entry level access for new businesses.</li>
                <li>• Advanced tools for growing teams.</li>
                <li>• Scalable infrastructure for expansion.</li>
              </ul>
              <br />
              <p>The platform grows with your business.</p>
            </div>
          </div>

          <div id="our-commitment" className="scroll-mt-[120px] mb-12">
            <h3 className="font-bold text-[16px] mb-4 uppercase tracking-wide">OUR COMMITMENT</h3>
            <div className="space-y-2">
              <p>We commit to data protection.</p>
              <p>We commit to operational reliability.</p>
              <p>We commit to long term partnership with our users.</p>
              <br />
              <p>Fahampesa is not a short term tool.</p>
              <p>It is a business system.</p>
              <br />
              <p className="font-medium">This is Fahampesa.</p>
              <p className="font-medium">Built for control.</p>
              <p className="font-medium">Built for growth.</p>
              <p className="font-medium">Built for serious business.</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-[120px] flex gap-6">
            {/* Timeline Line */}
            <div className="relative w-[2px] bg-[#f2f2f2] rounded-full">
              <div 
                className="absolute w-[2px] h-[40px] bg-[#191d23] rounded-full transition-all duration-300 ease-in-out"
                style={{
                  top: `${navItems.findIndex(item => item.id === activeSection) * 38}px`
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
                    "text-[18px] text-left transition-colors duration-200 h-[20px] leading-[20px] font-archivo",
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

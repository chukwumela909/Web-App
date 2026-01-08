import React from 'react'

export const PrivacyContent = () => {
  const sections = [
    { id: 'data-collected', title: 'Data collected' },
    { id: 'use-of-data', title: 'Use of data' },
    { id: 'data-security', title: 'Data security' },
    { id: 'payments', title: 'Payments' },
    { id: 'data-ownership', title: 'Data ownership and retention' },
    { id: 'policy-updates', title: 'Policy updates' },
    { id: 'contact-us', title: 'Contact us' },
  ]

  return (
    <div className="bg-white w-full flex justify-center py-10 lg:py-20">
      <div className="max-w-[1440px] w-full px-6 lg:px-[100px] relative flex flex-col lg:flex-row gap-10 lg:gap-20">
        
        {/* Main Text Content */}
        <div className="flex-1 max-w-[690px]">
          <h1 className="font-archivo font-semibold text-[#191d23] text-[36px] leading-normal mb-8 text-center lg:text-left">
            Privacy Policy
          </h1>
          
          <div className="font-archivo text-[#191d23] text-[16px] leading-[20px] space-y-6">
            <p className="leading-[20px] mb-0">Fahampesa values data protection and trust.</p>
            <p className="leading-[20px] mb-0">We collect information required to operate the platform effectively.</p>

            <div id="data-collected" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Data collected</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• Account information such as name, email, and phone number.</li>
                <li>• Business records including sales, inventory, and transactions.</li>
                <li>• Technical data used for security, reliability, and performance monitoring.</li>
              </ul>
            </div>

            <div id="use-of-data" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Use of data</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• Operate and maintain Fahampesa services.</li>
                <li>• Sync business data across approved devices.</li>
                <li>• Improve system reliability and platform performance.</li>
                <li>• Provide customer support and service communication.</li>
              </ul>
            </div>

            <div id="data-security" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Data security</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• Data is stored on secure infrastructure.</li>
                <li>• Access is restricted to authorized systems and personnel.</li>
                <li>• User data is not sold, rented, or shared for advertising.</li>
                <li>• Fahampesa follows applicable data protection laws in its operating regions.</li>
              </ul>
            </div>

            <div id="payments" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Payments</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• Payments are processed by licensed and regulated third party providers.</li>
                <li>• Fahampesa does not store full payment credentials.</li>
              </ul>
            </div>

            <div id="data-ownership" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Data ownership and retention</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• Users retain full ownership of their business data.</li>
                <li>• Data is retained only as required to deliver services and meet legal obligations.</li>
                <li>• Data removal requests are processed through official support channels.</li>
              </ul>
            </div>

            <div id="policy-updates" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">Policy updates</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>• This policy is updated periodically to reflect service or regulatory changes.</li>
              </ul>
            </div>

            <div id="contact-us" className="pt-4 scroll-mt-24">
              <h2 className="font-bold uppercase mb-4">CONTACT US</h2>
              <p className="leading-[20px] mb-2">Please contact our privacy team with any questions or concerns regarding this Privacy Policy at</p>
              <a href="mailto:privacy@fahampesa.com" className="leading-[20px] text-[#004aad] hover:underline">privacy@fahampesa.com</a>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation - Hidden on mobile, visible on lg screens */}
        <div className="hidden lg:flex flex-col gap-[24px] sticky top-32 h-fit min-w-[250px]">
          <div className="flex gap-4">
            {/* Vertical Line Indicator */}
            <div className="w-[2px] bg-[#f2f2f2] rounded-[4px] relative">
              {/* Active Indicator - Example: top-0 for first item. 
                  In a real implementation, this would track scroll position. 
                  For now static or basic highlighting. */}
               <div className="absolute top-0 left-0 w-full h-[40px] bg-[#191d23] rounded-[4px]" />
            </div>

            {/* Links */}
            <div className="flex flex-col gap-[18px]">
              {sections.map((section, index) => (
                <a 
                  key={section.id} 
                  href={`#${section.id}`}
                  className={`text-[18px] font-archivo leading-[20px] transition-colors ${index === 0 ? 'text-[#191d23]' : 'text-[#9b9797] hover:text-[#191d23]'}`}
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>
          
          {/* Scrollbar Indicator (Visual from Figma) */}
          <div className="w-[6px] bg-[#f2f2f2] h-[112px] rounded-[4px] hidden">
             {/* This looks like a custom scrollbar track or aesthetic element in Figma. Skipping for standard browser scroll behavior unless needed. */}
          </div>
        </div>

      </div>
    </div>
  )
}

"use client"

import Image from "next/image"

interface PricingHeroProps {
  isYearly: boolean
  setIsYearly: (value: boolean) => void
}

export default function PricingHero({ isYearly, setIsYearly }: PricingHeroProps) {
  return (
    <section className="bg-white py-16 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Special Offer: 1 Year <span style={{ color: "#004AAD" }}>+ 2 Months</span>
        </h1>
        <p className="text-gray-600 mb-8">Two months free when choose a yearly plan</p>

        <div className="flex items-center justify-center gap-6 mb-12 relative">
          <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-500"}`}>Pay Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isYearly ? "bg-[#004AAD]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isYearly ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
          <div className="relative">
            <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-500"}`}>Pay Yearly</span>
            {isYearly && (
              <Image
                src="/underline.png"
                alt="Underline"
                width={50}
                height={8}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
              />
            )}
          </div>

          <div className="relative ml-4">
            <Image
              src="/arrow.png"
              alt="Arrow pointing to savings"
              width={60}
              height={40}
              className="absolute -top-6 -left-8"
            />
            <div className="text-[#004AAD] text-sm font-semibold pt-2">Save 20%</div>
          </div>
        </div>
      </div>
    </section>
  )
}

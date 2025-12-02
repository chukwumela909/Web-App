import { Check, X } from "lucide-react"

interface PricingCardsProps {
  isYearly: boolean
}

export default function PricingCards({ isYearly }: PricingCardsProps) {
  const features = [
    { name: "Add up to 20 products", free: true, pro: true },
    { name: "Inventory access", free: true, pro: true },
    { name: "Record limited demo sales", free: true, pro: true },
    { name: "Debtors record", free: false, pro: true },
    { name: "Unlimited Branches", free: false, pro: true },
    { name: "Advanced reports (Profit/Loss)", free: false, pro: true },
    { name: "Staff Management & Permissions", free: false, pro: true },
    { name: "Sync across Mobile, Web, and Desktop", free: false, pro: true },
  ]

  const freePrice = isYearly ? "$0" : "$0"
  const proPrice = isYearly ? "$120" : "$10"
  const freePeriod = isYearly ? "/ Year" : "/ Month"
  const proPeriod = isYearly ? "/ Year" : "/ Month"

  return (
    <section className="bg-gray-50 py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-sm text-gray-600 mb-6">
              Ideal for businesses/individuals who need quick access for testing and onboarding.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{freePrice}</span>
              <span className="text-gray-600 ml-2">{freePeriod}</span>
            </div>

            <button
              className="w-full py-3 px-4 border-2 rounded-full hover:bg-blue-50 transition-colors mb-8 font-semibold"
              style={{ borderColor: "#004AAD", color: "#004AAD" }}
            >
              Get Started Now
            </button>

            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.free ? (
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#004AAD" }} />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={feature.free ? "text-gray-900" : "text-gray-400"}>{feature.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Plan */}
          <div
            className="rounded-2xl p-8 border-2 relative"
            style={{ backgroundColor: "#004AAD", borderColor: "#004AAD" }}
          >
            <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
            <p className="text-sm mb-6 text-white">
              Ideal for businesses/individuals who need full access and advanced features.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{proPrice}</span>
              <span className="ml-2 text-white">{proPeriod}</span>
            </div>

            <button className="w-full py-3 px-4 bg-white text-[#004AAD] font-semibold rounded-full hover:bg-gray-100 transition-colors mb-8">
              Get Pro
            </button>

            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.pro ? (
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
                  ) : (
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-300" />
                  )}
                  <span className={feature.pro ? "text-white" : "text-gray-300"}>{feature.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            className="px-6 py-2 border-2 font-semibold rounded-full hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            style={{ borderColor: "#004AAD", color: "#004AAD" }}
          >
            Compare Features
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

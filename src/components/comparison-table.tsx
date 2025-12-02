import { Check, X } from "lucide-react"

export default function ComparisonTable() {
  const rows = [
    { feature: "Create Sales", mobile: true, web: "(Up to 5 daily)", desktop: "Unlimited" },
    { feature: "Products Limit", mobile: true, web: "(Up to 10)", desktop: "Unlimited" },
    { feature: "Inventory Management", mobile: true, web: true, desktop: true },
    { feature: "Multi-Branch Access", mobile: false, web: false, desktop: true },
    { feature: "Staff Roles", mobile: false, web: false, desktop: true },
    { feature: "Advanced Reports", mobile: false, web: false, desktop: true },
    { feature: "Offline Mode", mobile: "(local)", web: false, desktop: "(full sync)" },
    { feature: "M-Pesa Integration", mobile: false, web: false, desktop: "(auto + webhook)" },
    { feature: "Data Sync", mobile: "(when connected)", web: "(when connected)", desktop: "(full sync)" },
    { feature: "Subscription Required", mobile: false, web: false, desktop: true },
    { feature: "Download Option", mobile: false, web: false, desktop: "(after payment)" },
  ]

  const FeatureCell = ({ value }: { value: string | boolean }) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Check className="w-4 h-4" style={{ color: "#004AAD" }} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      )
    }
    return (
      <div className="flex justify-center items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3" style={{ color: "#004AAD" }} />
        </div>
        <span className="text-sm text-gray-600">{value}</span>
      </div>
    )
  }

  return (
    <section className="bg-white py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Compare Features</h2>

        <div className="overflow-x-auto">
          <div className="relative pt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="text-left py-4 px-4 font-medium text-sm border-r border-gray-200"
                    style={{ backgroundColor: "#E8F0FF", color: "#004AAD" }}
                  >
                    Features
                  </th>
                  <th
                    className="text-center py-4 px-4 font-medium text-sm border-r border-gray-200"
                    style={{ backgroundColor: "#E8F0FF", color: "#004AAD" }}
                  >
                    Mobile App
                  </th>
                  <th
                    className="text-center py-4 px-4 font-medium text-sm"
                    style={{ backgroundColor: "#E8F0FF", color: "#004AAD", borderRight: "2px solid #004AAD" }}
                  >
                    Web App (Free)
                  </th>
                  <th
                    className="text-center py-4 px-4 font-medium text-sm"
                    style={{
                      backgroundColor: "#E8F0FF",
                      color: "#004AAD",
                      border: "2px solid #004AAD",
                      borderRadius: "0.5rem",
                    }}
                  >
                    Desktop App (Pro)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 border-b border-gray-200 border-r">
                      {row.feature}
                    </td>
                    <td className="py-4 px-4 text-center border-b border-gray-200 border-r">
                      <FeatureCell value={row.mobile} />
                    </td>
                    <td className="py-4 px-4 text-center border-b border-gray-200 border-r">
                      <FeatureCell value={row.web} />
                    </td>
                    <td className="py-4 px-4 text-center border-b border-gray-200 border-r">
                      <FeatureCell value={row.desktop} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className="absolute text-xs font-normal text-white px-2 py-1 text-center rounded-t-md capitalize"
              style={{
                backgroundColor: "#004AAD",
                top: "0",
                right: "0",
                width: "calc(25% - 4px)",
              }}
            >
              FULL ACCESS
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            className="px-8 py-3 text-white font-semibold rounded-full hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            style={{ backgroundColor: "#004AAD" }}
          >
            See All Plans
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

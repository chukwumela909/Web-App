// Product Categories for Hardware Store
export const PRODUCT_CATEGORIES = [
  "All Categories",
  "General Hardware",
  "Plumbing",
  "Electrical",
  "Tools & Equipment",
  "Building Materials",
  "Paints & Finishes",
  "Safety & Security",
  "Garden & Outdoor",
  "Fasteners & Fixings",
  "Electronics",
  "Food & Beverages", 
  "Clothing",
  "Beauty & Health",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Automotive",
  "Toys & Games"
] as const

// Categories for suppliers (excluding "All Categories")
export const SUPPLIER_CATEGORIES = PRODUCT_CATEGORIES.slice(1).concat([
  "Office Supplies",
  "Raw Materials",
  "Packaging",
  "Equipment",
  "Services",
  "Other"
])

// Hardware-specific subcategories for better organization
export const HARDWARE_SUBCATEGORIES = {
  "General Hardware": [
    "Hand Tools",
    "Power Tools",
    "Hardware Accessories",
    "Locks & Security",
    "Hinges & Hardware"
  ],
  "Plumbing": [
    "Pipes & Fittings",
    "Valves & Taps",
    "Drainage",
    "Water Heaters",
    "Plumbing Tools"
  ],
  "Electrical": [
    "Wiring & Cables",
    "Switches & Sockets",
    "Circuit Protection",
    "Lighting",
    "Electrical Tools"
  ],
  "Tools & Equipment": [
    "Hand Tools",
    "Power Tools",
    "Measuring Tools",
    "Cutting Tools",
    "Safety Equipment"
  ],
  "Building Materials": [
    "Cement & Concrete",
    "Bricks & Blocks",
    "Timber & Wood",
    "Roofing Materials",
    "Insulation"
  ],
  "Paints & Finishes": [
    "Interior Paints",
    "Exterior Paints",
    "Primers & Sealers",
    "Brushes & Rollers",
    "Thinners & Solvents"
  ],
  "Safety & Security": [
    "Personal Protective Equipment",
    "Fire Safety",
    "Security Systems",
    "Warning Signs",
    "Emergency Equipment"
  ],
  "Fasteners & Fixings": [
    "Screws & Bolts",
    "Nails & Pins",
    "Anchors & Plugs",
    "Adhesives & Sealants",
    "Washers & Spacers"
  ]
} as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
export type SupplierCategory = typeof SUPPLIER_CATEGORIES[number]

// Units of Measure for Hardware Store Products
export const UNITS_OF_MEASURE = [
  "pcs",           // pieces - default for most hardware items
  "kg",            // kilograms - for bulk materials
  "g",             // grams - for small items
  "litre",         // litres - for liquids
  "ml",            // millilitres - for small liquid quantities
  "box",           // boxes - for packaged items
  "pack",          // packs - for multi-item packages
  "bottle",        // bottles - for liquid containers
  "can",           // cans - for canned products
  "bag",           // bags - for bagged items
  "roll",          // rolls - for wire, tape, etc.
  "meter",         // metres - for cables, pipes, etc.
  "feet",          // feet - alternative measurement
  "dozen",         // dozens - for sets of 12
  "inches",        // inches - for measurements
  "yards",         // yards - for longer measurements
  "square meter",  // square metres - for area coverage
  "square feet",   // square feet - for area coverage
  "cubic meter",   // cubic metres - for volume
  "length",        // length - for variable length items
  "coil",          // coils - for wire, cable coils
  "bundle",        // bundles - for grouped items
  "set",           // sets - for tool sets, etc.
  "pair",          // pairs - for paired items
  "sheet",         // sheets - for plywood, metal sheets
  "panel",         // panels - for wall panels, etc.
  "tube",          // tubes - for sealants, adhesives
  "gallon",        // gallons - for large liquid quantities
  "quart",         // quarts - for medium liquid quantities
] as const

// Hardware-specific unit groupings
export const UNIT_CATEGORIES = {
  "Weight": ["kg", "g"],
  "Volume": ["litre", "ml", "gallon", "quart"],
  "Length": ["meter", "feet", "inches", "yards"],
  "Area": ["square meter", "square feet"],
  "Volume_3D": ["cubic meter"],
  "Count": ["pcs", "dozen", "pair", "set"],
  "Packaging": ["box", "pack", "bag", "bundle", "coil", "roll"],
  "Containers": ["bottle", "can", "tube"],
  "Materials": ["sheet", "panel", "length"]
} as const

export type UnitOfMeasure = typeof UNITS_OF_MEASURE[number]
export type UnitCategory = keyof typeof UNIT_CATEGORIES

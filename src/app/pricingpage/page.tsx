"use client"

import { useState } from "react"
import Header from "@/components/header"
import PricingHero from "@/components/pricing-hero"
import PricingCards from "@/components/pricing-cards"
import ComparisonTable from "@/components/comparison-table"
import Footer from "@/components/footer"

export default function Home() {
  const [isYearly, setIsYearly] = useState(true)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PricingHero isYearly={isYearly} setIsYearly={setIsYearly} />
      <PricingCards isYearly={isYearly} />
      <ComparisonTable />
      <Footer />
    </div>
  )
}

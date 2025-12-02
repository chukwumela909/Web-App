'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

interface FAQSectionProps {
  title: string
  description?: string
  faqs: FAQItem[]
  className?: string
}

const FAQAccordionItem: React.FC<{
  faq: FAQItem
  isOpen: boolean
  onToggle: () => void
}> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 pr-4">
            {faq.question}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </motion.div>
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 pt-2">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {faq.answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  title,
  description,
  faqs,
  className
}) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setOpenItems(new Set(faqs.map(faq => faq.id)))
  }

  const collapseAll = () => {
    setOpenItems(new Set())
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm text-[#004AAD] hover:bg-blue-50 rounded-md transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <FAQAccordionItem
            key={faq.id}
            faq={faq}
            isOpen={openItems.has(faq.id)}
            onToggle={() => toggleItem(faq.id)}
          />
        ))}
      </div>
    </div>
  )
}

export const FAQCard: React.FC<{
  title: string
  description?: string
  faqs: FAQItem[]
  className?: string
}> = ({ title, description, faqs, className }) => {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <FAQSection
          title=""
          faqs={faqs}
          className="mb-0"
        />
      </CardContent>
    </Card>
  )
}

'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FAQSection } from '@/components/ui/faq'
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  HelpCircle,
  Calendar,
  Clock,
  Users,
  Award,
  HeadphonesIcon,
  BookOpen,
  Video,
  Search
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

// FAQ Data for FahamPesa
const faqData = [
  {
    id: 'getting-started-1',
    question: 'How do I set up my business profile?',
    answer: 'Navigate to the Business tab in Settings. Fill in your business name, type, currency preferences, and tax settings. Don\'t forget to save your changes after updating your information.'
  },
  {
    id: 'getting-started-2',
    question: 'How do I add my first product to inventory?',
    answer: 'Go to Dashboard > Inventory > Products. Click "Add Product" and fill in the product details including name, description, price, and stock quantity. You can also upload product images and set up barcode tracking.'
  },
  {
    id: 'getting-started-3',
    question: 'How do I record my first sale?',
    answer: 'From the main dashboard, click "Record Sale" or navigate to Sales. Select the products sold, enter quantities, and the system will automatically calculate totals including taxes. You can print receipts and track customer information.'
  },
  {
    id: 'inventory-1',
    question: 'How do low stock alerts work?',
    answer: 'Set your low stock threshold in Business Settings. When any product\'s stock falls below this number, you\'ll receive notifications (email/SMS if enabled). The system will highlight low-stock items in red on your inventory dashboard.'
  },
  {
    id: 'inventory-2',
    question: 'Can I track product variations (sizes, colors)?',
    answer: 'Yes! When adding a product, you can create variations for different sizes, colors, or other attributes. Each variation can have its own price, stock level, and barcode for precise inventory tracking.'
  },
  {
    id: 'inventory-3',
    question: 'How do I handle product returns and refunds?',
    answer: 'Go to Sales > Transactions, find the original sale, and click "Process Return". Select the items being returned, specify the reason, and choose between refund or store credit. Stock levels will be automatically adjusted.'
  },
  {
    id: 'sales-1',
    question: 'How can I track daily, weekly, and monthly sales?',
    answer: 'Visit the Reports section to view comprehensive sales analytics. You can filter by date range, product categories, or specific items. Export reports to PDF or Excel for further analysis or tax purposes.'
  },
  {
    id: 'sales-2',
    question: 'Can I offer discounts and promotions?',
    answer: 'Yes! During sale recording, you can apply percentage or fixed amount discounts to individual items or entire transactions. Set up promotional campaigns with start/end dates in the Pricing section.'
  },
  {
    id: 'sales-3',
    question: 'How do I manage multiple payment methods?',
    answer: 'FahamPesa supports cash, card, mobile money (M-Pesa, Airtel Money), and bank transfers. During checkout, select the payment method and the system will track payment reconciliation automatically.'
  },
  {
    id: 'staff-1',
    question: 'How do I add staff members and set permissions?',
    answer: 'Go to Dashboard > Staff. Click "Add Staff Member" and enter their details. Assign roles like Cashier, Manager, or Admin. Each role has different permissions for accessing sales, inventory, and financial data.'
  },
  {
    id: 'staff-2',
    question: 'Can I track individual staff performance?',
    answer: 'Absolutely! Each staff member\'s sales are tracked separately. View individual performance reports showing sales volume, transaction counts, and commission calculations in the Staff Analytics section.'
  },
  {
    id: 'reports-1',
    question: 'What financial reports are available?',
    answer: 'FahamPesa generates profit/loss statements, cash flow reports, tax summaries, inventory valuation, sales trends, and expense tracking. All reports can be customized by date range and exported for accounting purposes.'
  },
  {
    id: 'reports-2',
    question: 'How do I prepare for tax filing?',
    answer: 'Use the Tax Reports feature to generate VAT returns, income summaries, and expense categorization. The system maintains detailed transaction logs and can export data in formats accepted by tax authorities.'
  },
  {
    id: 'technical-1',
    question: 'Does FahamPesa work offline?',
    answer: 'Yes! Enable offline mode in Data & Sync settings. You can record sales, update inventory, and manage daily operations without internet. Data syncs automatically when connection is restored.'
  },
  {
    id: 'technical-2',
    question: 'How do I backup my business data?',
    answer: 'Go to Settings > Data & Sync > Data Backup. Enable automatic backups to Google Drive, Dropbox, or local storage. Set backup frequency (daily/weekly/monthly) to ensure your data is always protected.'
  },
  {
    id: 'technical-3',
    question: 'Can I connect barcode scanners and receipt printers?',
    answer: 'Yes! Connect devices via Bluetooth or USB in Settings > Devices. FahamPesa supports most standard barcode scanners and thermal receipt printers. Configure print templates in Receipt Settings.'
  },
  {
    id: 'billing-1',
    question: 'What are the subscription plans available?',
    answer: 'FahamPesa offers Free (basic features), Pro (advanced inventory + reports), and Enterprise (multi-location + advanced analytics) plans. Upgrade anytime to unlock additional features as your business grows.'
  },
  {
    id: 'billing-2',
    question: 'How do I upgrade my subscription?',
    answer: 'Click on your profile menu and select "Upgrade Plan". Choose your preferred plan and payment method. Upgrades take effect immediately, and you can always downgrade at the end of your billing cycle.'
  }
]

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div 
          className="space-y-8 p-4 md:p-6"
          {...fadeInUp}
        >
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get the help you need to make the most of FahamPesa. Browse our comprehensive FAQ, 
              contact our support team, or explore our learning resources.
            </p>
          </div>

          {/* Quick Search - Coming Soon */}
          <Card className="rounded-xl shadow-sm bg-gradient-to-r from-[#004AAD] to-blue-600 text-white">
            <CardContent className="py-8">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h2 className="text-2xl font-bold mb-2">Quick Search</h2>
                <p className="opacity-90 mb-4">Find answers instantly with our intelligent search</p>
                <div className="max-w-md mx-auto">
                  <input 
                    type="text" 
                    placeholder="Search for help topics..." 
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
                    disabled
                  />
                </div>
                <p className="text-sm opacity-75 mt-2">Coming Soon</p>
              </div>
            </CardContent>
          </Card>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Support */}
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-[#004AAD] rounded-full w-16 h-16 flex items-center justify-center">
                  <HeadphonesIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Get personalized help from our expert team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-[#004AAD]" />
                    <div>
                      <p className="font-medium text-sm">Phone Support</p>
                      <p className="text-xs text-gray-600">+254 700 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-[#004AAD]" />
                    <div>
                      <p className="font-medium text-sm">Email Support</p>
                      <p className="text-xs text-gray-600">support@fahampesa.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-xs text-gray-600">9 AM - 6 PM support</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-[#004AAD] hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Conversation
                </Button>
              </CardContent>
            </Card>

            {/* Learning Resources */}
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Learning Resources</CardTitle>
                <CardDescription>
                  Master FahamPesa with our guides and tutorials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-3" />
                  User Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-3" />
                  Video Tutorials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-3" />
                  Best Practices
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule Training
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-orange-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system performance and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">All Systems</span>
                    </div>
                    <span className="text-xs text-green-700 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">&lt; 200ms</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  View Status Page
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find instant answers to the most common questions about FahamPesa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FAQSection
                title=""
                faqs={faqData}
              />
            </CardContent>
          </Card>

          {/* Support Stats */}
          <Card className="rounded-xl shadow-sm bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100">
            <CardHeader className="text-center">
              <CardTitle>Our Support Promise</CardTitle>
              <CardDescription>
                We're committed to helping your business succeed with FahamPesa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#004AAD] mb-2">&lt; 2hrs</div>
                  <div className="text-sm text-gray-600">Average Response Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                  <div className="text-sm text-gray-600">Customer Satisfaction</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Email Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                  <div className="text-sm text-gray-600">Happy Businesses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

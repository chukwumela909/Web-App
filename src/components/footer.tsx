import { Facebook, Twitter, Instagram, Mail, MessageCircle } from "lucide-react"

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#001223" }} className="text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">FahamPesa</h3>
            <p className="text-sm text-gray-400">
              Empowering small business owners across Kenya with smart offline-first sales and inventory management
              tools.
            </p>
            <div className="flex gap-4 mt-6">
              <Facebook className="w-5 h-5 hover:text-[#004AAD] cursor-pointer transition-colors stroke-[1.5]" />
              <Twitter className="w-5 h-5 hover:text-[#004AAD] cursor-pointer transition-colors stroke-[1.5]" />
              <Instagram className="w-5 h-5 hover:text-[#004AAD] cursor-pointer transition-colors stroke-[1.5]" />
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  User Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 stroke-[1.5]" style={{ color: "#FFA500" }} />
                <a href="mailto:support@fahampesa.com" className="hover:text-white transition-colors">
                  support@fahampesa.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 stroke-[1.5]" style={{ color: "#FFA500" }} />
                <a href="#" className="hover:text-white transition-colors">
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex items-center justify-between text-sm text-gray-400">
          <p>© 2025 FahamPesa. Built with ❤️ for small business owners in Kenya and beyond.</p>
          <a href="#" className="hover:text-white transition-colors">
            Business Login
          </a>
        </div>
      </div>
    </footer>
  )
}

// 'use client'

// import { motion } from 'framer-motion'
// import { 
//   ShoppingCart, 
//   BarChart3, 
//   Package, 
//   CheckCircle, 
//   Download,
//   Apple,
//   PlayCircle,
//   Mail,
//   MessageCircle,
//   Twitter,
//   Facebook,
//   Instagram,
//   ArrowRight,
//   Sun,
//   WifiOff,
//   Shield,
//   Menu,
//   X,
//   UserPlus,
//   Plus,
//   TrendingUp,
//   Play
// } from 'lucide-react'
// import { useState } from 'react'

// export default function LandingPage() {
//   const [showComingSoon, setShowComingSoon] = useState(false)
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

//   // Animation variants
//   const fadeInUp = {
//     initial: { opacity: 0, y: 60 },
//     animate: { opacity: 1, y: 0 },
//     transition: { duration: 0.6 }
//   }

//   const staggerChildren = {
//     animate: {
//       transition: {
//         staggerChildren: 0.1
//       }
//     }
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header/Navigation */}
//       <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
//         <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-14 sm:h-16">
//             {/* Logo */}
//             <motion.div 
//               className="flex items-center space-x-2 sm:space-x-3"
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//             >
//               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center shadow-md">
//                 <span className="text-white font-bold text-lg sm:text-xl">F</span>
//               </div>
//               <div className="hidden xs:block sm:block">
//                 <h1 className="text-lg sm:text-xl font-bold text-[#004AAD]">FahamPesa</h1>
//                 <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Smart Business Tools</p>
//               </div>
//             </motion.div>

//             {/* Navigation */}
//             <motion.nav 
//               className="hidden md:flex items-center space-x-8"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//             >
//               <a href="#features" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
//                 Features
//               </a>
//               <a href="#benefits" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
//                 Benefits
//               </a>
//               <a href="#download" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
//                 Download
//               </a>
//               <a href="#contact" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
//                 Contact
//               </a>
//             </motion.nav>

//             {/* Mobile Menu Button & CTA */}
//             <div className="flex items-center space-x-2 sm:space-x-4">
//               {/* Login Button */}
//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: 0.15 }}
//                 className="hidden sm:block"
//               >
//                 <a 
//                   href="/login"
//                   className="text-[#004AAD] hover:text-[#FF9500] font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm sm:text-base"
//                 >
//                   Login
//                 </a>
//               </motion.div>

//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: 0.2 }}
//                 className="hidden sm:block"
//               >
//                 <a 
//                   href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="bg-[#FF9500] text-black px-4 sm:px-6 py-2 rounded-xl font-semibold hover:bg-[#e6850e] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
//                 >
//                   Download App
//                 </a>
//               </motion.div>
              
//               {/* Mobile Menu Button */}
//               <button
//                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                 className="md:hidden p-2 text-gray-700 hover:text-[#004AAD] transition-colors hover:bg-gray-100 rounded-lg"
//               >
//                 {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {/* Mobile Menu */}
//         {mobileMenuOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             className="md:hidden bg-white border-t border-gray-200 shadow-lg"
//           >
//             <div className="px-4 py-4 space-y-3">
//               <a 
//                 href="#features" 
//                 className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 Features
//               </a>
//               <a 
//                 href="#benefits" 
//                 className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 Benefits
//               </a>
//               <a 
//                 href="#download" 
//                 className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 Download
//               </a>
//               <a 
//                 href="#contact" 
//                 className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 Contact
//               </a>
//               <div className="pt-2 border-t border-gray-100 space-y-3">
//                 <a 
//                   href="/login"
//                   className="block w-full bg-[#004AAD] text-white px-6 py-4 rounded-xl font-semibold hover:bg-[#003a8c] transition-all text-center shadow-md hover:shadow-lg transform hover:scale-[0.98] active:scale-95"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   Login
//                 </a>
//                 <a 
//                   href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="block w-full bg-[#FF9500] text-black px-6 py-4 rounded-xl font-semibold hover:bg-[#e6850e] transition-all text-center shadow-md hover:shadow-lg transform hover:scale-[0.98] active:scale-95"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   Download App
//                 </a>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </header>

//       {/* Hero Section */}
//       <section className="relative overflow-hidden bg-gradient-to-br from-[#001122] via-[#004AAD] to-[#FF9500] text-white pt-14 sm:pt-16">
//         {/* Enhanced Background Pattern */}
//         <div className="absolute inset-0 opacity-20">
//           <div className="absolute inset-0" style={{
//             backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='27' r='1.5'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3Ccircle cx='67' cy='67' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
//           }} />
//         </div>

//         {/* Animated floating elements */}
//         <div className="absolute inset-0 overflow-hidden">
//           <motion.div
//             className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[#FF9500] to-transparent rounded-full opacity-30"
//             animate={{
//               y: [0, -20, 0],
//               rotate: [0, 360]
//             }}
//             transition={{
//               duration: 8,
//               repeat: Infinity,
//               ease: "easeInOut"
//             }}
//           />
//           <motion.div
//             className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[#0056CC] to-transparent rounded-full opacity-20"
//             animate={{
//               y: [0, 30, 0],
//               rotate: [0, -360]
//             }}
//             transition={{
//               duration: 12,
//               repeat: Infinity,
//               ease: "easeInOut"
//             }}
//           />
//           <motion.div
//             className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-white to-transparent rounded-full opacity-10"
//             animate={{
//               y: [0, -40, 0],
//               x: [0, 20, 0]
//             }}
//             transition={{
//               duration: 10,
//               repeat: Infinity,
//               ease: "easeInOut"
//             }}
//           />
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
//           <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
//             {/* Left Content */}
//             <motion.div 
//               initial="initial"
//               animate="animate"
//               variants={staggerChildren}
//             >
//               <motion.div variants={fadeInUp} className="mb-4 sm:mb-6">
//                 <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-[#FF9500] text-black font-semibold text-xs sm:text-sm shadow-lg">
//                   <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//                   Smart Tools for Modern Businesses.
//                 </span>
//               </motion.div>

//               <motion.h1 
//                 variants={fadeInUp}
//                 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
//               >
//                 Powerful Sales and
//                 <span className="block text-[#FF9500]">Anywhere, Anytime</span>
//               </motion.h1>

//               <motion.p 
//                 variants={fadeInUp}
//                 className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 sm:mb-10 leading-relaxed"
//               >
//                 Fahampesa gives your business the tools to sell faster, track stock in real time, and stay in control anywhere. Secure, offline-first, and built to scale with you.
//               </motion.p>

//               {/* 3-Step Guide */}
//               <motion.div 
//                 variants={fadeInUp}
//                 className="mb-8 sm:mb-10"
//               >
//                 <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 text-center">Get started in 3 simple steps:</h3>
//                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
//                   <div className="flex flex-col items-center text-center group">
//                     <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
//                       <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
//                     </div>
//                     <span className="text-sm sm:text-base font-semibold text-white">Sign up</span>
//                   </div>
                  
//                   <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9500] rotate-90 sm:rotate-0" />
                  
//                   <div className="flex flex-col items-center text-center group">
//                     <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
//                       <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
//                     </div>
//                     <span className="text-sm sm:text-base font-semibold text-white">Add products</span>
//                   </div>
                  
//                   <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9500] rotate-90 sm:rotate-0" />
                  
//                   <div className="flex flex-col items-center text-center group">
//                     <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
//                       <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
//                     </div>
//                     <span className="text-sm sm:text-base font-semibold text-white">Start selling</span>
//                   </div>
//                 </div>
//               </motion.div>

//               {/* Main CTA Button */}
//               <motion.div 
//                 variants={fadeInUp}
//                 className="text-center mb-6 sm:mb-8"
//               >
//                 <a 
//                   href="/login"
//                   className="group inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 bg-[#FF9500] text-black font-bold text-lg sm:text-xl rounded-xl hover:bg-[#e6850e] transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-3xl"
//                 >
//                   Sign in and start your first sale
//                   <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3 group-hover:translate-x-1 transition-transform" />
//                 </a>
//               </motion.div>

//               {/* Secondary Actions */}
//               <motion.div 
//                 variants={fadeInUp}
//                 className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
//               >
//                 <a 
//                   href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#FF9500] text-[#FF9500] font-semibold rounded-xl hover:bg-[#FF9500] hover:text-black active:scale-95 transition-all duration-200 text-sm sm:text-base"
//                 >
//                   <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
//                   Download Android App
//                 </a>
                
//                 {/* Testimonial Video Button */}
//                 <button 
//                   onClick={() => {
//                     const video = document.getElementById('testimonial-video') as HTMLVideoElement;
//                     if (video) {
//                       video.play();
//                       video.scrollIntoView({ behavior: 'smooth' });
//                     }
//                   }}
//                   className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-[#004AAD] active:scale-95 transition-all duration-200 text-sm sm:text-base"
//                 >
//                   <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
//                   Watch Testimonial
//                 </button>
//               </motion.div>

//               <motion.div 
//                 variants={fadeInUp}
//                 className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-300"
//               >
//                 <div className="flex items-center">
//                   <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
//                   works online and offline
//                 </div>
//                 <div className="flex items-center">
//                   <Sun className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
//                   Real-time reports and insights
//                 </div>
//                 <div className="flex items-center">
//                   <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
//                   Secure by design
//                 </div>
//               </motion.div>
//             </motion.div>

//             {/* Right Content - Dashboard Screenshot */}
//             <motion.div
//               initial={{ opacity: 0, x: 50 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.8, delay: 0.3 }}
//               className="relative lg:order-2 mt-8 lg:mt-0"
//             >
//               {/* Pure Screenshot Display - Larger Size */}
//               <div className="relative mx-auto max-w-4xl lg:max-w-5xl">
//                 <img 
//                   src="/dashboard-screenshot.png" 
//                   alt="FahamPesa Dashboard Preview" 
//                   className="w-full h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
//                 />
//               </div>

//               {/* Floating Elements */}
//               <motion.div
//                 className="absolute -top-6 -right-6 bg-[#FF9500] text-black px-6 py-3 rounded-full text-base font-semibold shadow-lg"
//                 animate={{ y: [0, -10, 0] }}
//                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//               >
//                 Live Dashboard
//               </motion.div>
              
//               <motion.div
//                 className="absolute -bottom-6 -left-6 bg-white text-[#004AAD] px-6 py-3 rounded-full text-base font-semibold shadow-lg"
//                 animate={{ y: [0, 10, 0] }}
//                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
//               >
//                 Real-time Data
//               </motion.div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Testimonial Video Section */}
//       <section className="py-12 sm:py-16 lg:py-20 bg-white">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <motion.div
//             initial="initial"
//             whileInView="animate"
//             viewport={{ once: true }}
//             variants={staggerChildren}
//           >
//             <motion.h2 
//               variants={fadeInUp}
//               className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
//             >
//               Hear from Our <span className="text-[#FF9500]">Happy Customers</span>
//             </motion.h2>
//             <motion.p 
//               variants={fadeInUp}
//               className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
//             >
//               Real business owners sharing their success stories with FahamPesa
//             </motion.p>

//             <motion.div 
//               variants={fadeInUp}
//               className="relative max-w-3xl mx-auto"
//             >
//               {/* Video Container */}
//               <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
//                 <video 
//                   id="testimonial-video"
//                   className="w-full h-auto"
//                   controls
//                   poster="/testimonial-thumbnail.png"
//                   preload="metadata"
//                 >
//                   <source src="/testimonial-mohammed.mp4" type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
                
//                 {/* Play Overlay */}
//                 <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-300">
//                   <button 
//                     onClick={() => {
//                       const video = document.getElementById('testimonial-video') as HTMLVideoElement;
//                       if (video) {
//                         if (video.paused) {
//                           video.play();
//                         } else {
//                           video.pause();
//                         }
//                       }
//                     }}
//                     className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF9500] rounded-full flex items-center justify-center hover:bg-[#e6850e] transition-colors shadow-lg"
//                   >
//                     <Play className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1" />
//                   </button>
//                 </div>
//               </div>

//               {/* Customer Info */}
//               <motion.div 
//                 variants={fadeInUp}
//                 className="mt-6 sm:mt-8 flex items-center justify-center space-x-3 sm:space-x-4"
//               >
//                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-full flex items-center justify-center shadow-lg">
//                   <span className="text-white font-bold text-lg sm:text-xl">M</span>
//                 </div>
//                 <div className="text-left">
//                   <h4 className="text-lg sm:text-xl font-semibold text-gray-900">Mohammed</h4>
//                   <p className="text-sm sm:text-base text-gray-600">Small Business Owner</p>
//                 </div>
//               </motion.div>

//               {/* Quote */}
//               <motion.blockquote 
//                 variants={fadeInUp}
//                 className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-700 italic max-w-2xl mx-auto leading-relaxed"
//               >
//                 "FahamPesa has completely transformed how I manage my business. The offline features are a game-changer!"
//               </motion.blockquote>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div 
//             className="text-center mb-8 sm:mb-12 lg:mb-16"
//             initial="initial"
//             whileInView="animate"
//             viewport={{ once: true }}
//             variants={fadeInUp}
//           >
//             <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
//               Everything You Need to Run Your Business
//             </h2>
//             <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 leading-relaxed">
//               From inventory management to sales tracking, FahamPesa provides all the tools 
//               small business owners need to succeed in today&apos;s competitive market.
//             </p>
//           </motion.div>

//           <motion.div 
//             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
//             initial="initial"
//             whileInView="animate"
//             viewport={{ once: true }}
//             variants={staggerChildren}
//           >
//             {[
//               {
//                 icon: Package,
//                 title: "Smart Inventory Management",
//                 description: "Track your products, manage stock levels, and get low-stock alerts. Perfect for kiosks and small shops."
//               },
//               {
//                 icon: ShoppingCart,
//                 title: "Quick Sales Recording",
//                 description: "Record sales instantly and auto-update inventory. Optimized for fast transactions in busy environments."
//               },
//               {
//                 icon: BarChart3,
//                 title: "Daily & Weekly Reports",
//                 description: "Get insights into your business performance with detailed analytics and export reports via WhatsApp or PDF."
//               },
//               {
//                 icon: WifiOff,
//                 title: "Offline-First Design",
//                 description: "Works completely offline, syncs automatically when connected. Never lose a sale due to poor internet."
//               }
//             ].map((feature, index) => (
//               <motion.div 
//                 key={index}
//                 variants={fadeInUp}
//                 className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 active:scale-[0.98] cursor-pointer"
//               >
//                 <div className="bg-[#004AAD] text-white w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#FF9500] group-hover:text-black transition-all duration-300 shadow-md">
//                   <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
//                 </div>
//                 <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{feature.title}</h3>
//                 <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* Benefits Section */}
//       <section id="benefits" className="py-12 sm:py-16 lg:py-20 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
//             <motion.div
//               initial="initial"
//               whileInView="animate"
//               viewport={{ once: true }}
//               variants={fadeInUp}
//             >
//               <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 leading-tight">
//                 Designed for <span className="text-[#FF9500]">Real-World</span> Business Challenges
//               </h2>
//               <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-2 leading-relaxed">
//                 We understand the unique challenges small business owners face in Kenya. 
//                 That&apos;s why FahamPesa is built with features that actually matter for your daily operations.
//               </p>
              
//               <div className="space-y-4 sm:space-y-6 px-2">
//                 {[
//                   {
//                     icon: Sun,
//                     title: "Sunlight Optimized",
//                     description: "High contrast design perfect for outdoor markets and direct sunlight use."
//                   },
//                   {
//                     icon: CheckCircle,
//                     title: "Budget Phone Friendly",
//                     description: "Optimized for Tecno, Infinix, Itel, and other budget Android devices."
//                   },
//                   {
//                     icon: Shield,
//                     title: "Secure & Private",
//                     description: "Local data encryption and secure cloud sync with Firebase authentication."
//                   }
//                 ].map((benefit, index) => (
//                   <motion.div 
//                     key={index}
//                     variants={fadeInUp}
//                     className="flex items-start space-x-3 sm:space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
//                   >
//                     <div className="bg-[#004AAD] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
//                       <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">{benefit.title}</h3>
//                       <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             <motion.div
//               initial="initial"
//               whileInView="animate"
//               viewport={{ once: true }}
//               variants={fadeInUp}
//               className="relative mt-8 lg:mt-0"
//             >
//               {/* Stats Cards */}
//               <div className="bg-gradient-to-br from-[#004AAD] to-[#0056CC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl">
//                 <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center lg:text-left">Perfect for Kenyan Businesses</h3>
//                 <div className="grid grid-cols-2 gap-4 sm:gap-6">
//                   <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
//                     <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">99%</div>
//                     <div className="text-xs sm:text-sm text-gray-200 leading-tight">works online and offline</div>
//                   </div>
//                   <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
//                     <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">5s</div>
//                     <div className="text-xs sm:text-sm text-gray-200 leading-tight">Sale Recording</div>
//                   </div>
//                   <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
//                     <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">24/7</div>
//                     <div className="text-xs sm:text-sm text-gray-200 leading-tight">Real-time reports and insights</div>
//                   </div>
//                   <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
//                     <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">100%</div>
//                     <div className="text-xs sm:text-sm text-gray-200 leading-tight">Secure by design</div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Reports & Analytics Showcase */}
//       <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
//             {/* Left - Laptop with Reports Screenshot */}
//             <motion.div
//               initial={{ opacity: 0, x: -50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.8 }}
//               className="relative"
//             >
//               {/* Modern Laptop Mockup */}
//               <div className="relative mx-auto max-w-3xl">
//                 {/* Laptop Screen */}
//                 <div className="relative bg-gray-900 rounded-t-2xl p-4 shadow-2xl">
//                   {/* Screen Bezel */}
//                   <div className="bg-black rounded-xl p-2">
//                     {/* Reports Screenshot */}
//                     <div className="relative overflow-hidden rounded-lg bg-white">
//                       <motion.img 
//                         src="/reports-screenshot.png" 
//                         alt="FahamPesa Reports & Analytics" 
//                         className="w-full h-auto object-cover rounded-lg"
//                         initial={{ scale: 1.1 }}
//                         whileInView={{ scale: 1 }}
//                         transition={{ duration: 1, ease: "easeOut" }}
//                       />
//                       {/* Screen Glow Effect */}
//                       <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent rounded-lg"></div>
//                     </div>
//                   </div>
                  
//                   {/* Camera */}
//                   <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
//                 </div>
                
//                 {/* Laptop Base */}
//                 <div className="bg-gray-800 h-8 rounded-b-2xl shadow-lg relative">
//                   {/* Trackpad */}
//                   <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-gray-600 rounded-md"></div>
//                 </div>
                
//                 {/* Laptop Shadow */}
//                 <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full h-12 bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-full blur-xl"></div>
//               </div>

//               {/* Animated Data Points */}
//               <motion.div
//                 className="absolute top-8 -right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
//                 animate={{ 
//                   y: [0, -8, 0],
//                   rotate: [0, 2, 0]
//                 }}
//                 transition={{ 
//                   duration: 3, 
//                   repeat: Infinity, 
//                   ease: "easeInOut" 
//                 }}
//               >
//                 📈 Sales Up 24%
//               </motion.div>
              
//               <motion.div
//                 className="absolute bottom-12 -left-6 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
//                 animate={{ 
//                   y: [0, 12, 0],
//                   rotate: [0, -2, 0]
//                 }}
//                 transition={{ 
//                   duration: 4, 
//                   repeat: Infinity, 
//                   ease: "easeInOut",
//                   delay: 1
//                 }}
//               >
//                 📊 Live Data
//               </motion.div>

//               <motion.div
//                 className="absolute top-1/2 -left-8 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
//                 animate={{ 
//                   x: [0, -8, 0],
//                   rotate: [0, -3, 0]
//                 }}
//                 transition={{ 
//                   duration: 5, 
//                   repeat: Infinity, 
//                   ease: "easeInOut",
//                   delay: 2
//                 }}
//               >
//                 📋 Reports
//               </motion.div>
//             </motion.div>

//             {/* Right - Content */}
//             <motion.div
//               initial={{ opacity: 0, x: 50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.8, delay: 0.2 }}
//             >
//               <motion.div
//                 initial="initial"
//                 whileInView="animate"
//                 viewport={{ once: true }}
//                 variants={staggerChildren}
//               >
//                 <motion.h2 
//                   variants={fadeInUp}
//                   className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
//                 >
//                   Powerful <span className="text-[#FF9500]">Reports & Analytics</span>
//                 </motion.h2>
                
//                 <motion.p 
//                   variants={fadeInUp}
//                   className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed"
//                 >
//                   Get deep insights into your business performance with comprehensive reports, 
//                   real-time analytics, and actionable data to help you make informed decisions.
//                 </motion.p>

//                 <motion.div 
//                   variants={fadeInUp}
//                   className="space-y-4 sm:space-y-6 mb-6 sm:mb-8"
//                 >
//                   {[
//                     {
//                       icon: BarChart3,
//                       title: "Sales Analytics",
//                       description: "Track daily, weekly, and monthly sales performance with beautiful charts and graphs."
//                     },
//                     {
//                       icon: TrendingUp,
//                       title: "Growth Insights",
//                       description: "Identify trends, peak sales hours, and best-selling products to optimize your business."
//                     },
//                     {
//                       icon: Package,
//                       title: "Inventory Reports",
//                       description: "Monitor stock levels, track product movement, and get alerts for low inventory."
//                     }
//                   ].map((feature, index) => (
//                     <motion.div 
//                       key={index}
//                       variants={fadeInUp}
//                       className="flex items-start space-x-3 sm:space-x-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
//                     >
//                       <div className="bg-[#004AAD] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
//                         <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">{feature.title}</h3>
//                         <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </motion.div>

//                 <motion.div variants={fadeInUp}>
//                   <a 
//                     href="/login"
//                     className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-[#FF9500] text-black font-semibold rounded-xl hover:bg-[#e6850e] transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
//                   >
//                     Explore Analytics Dashboard
//                     <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
//                   </a>
//                 </motion.div>
//               </motion.div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Download Section */}
//       <section id="download" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <motion.div
//             initial="initial"
//             whileInView="animate"
//             viewport={{ once: true }}
//             variants={staggerChildren}
//           >
//             <motion.h2 
//               variants={fadeInUp}
//               className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 px-2 leading-tight"
//             >
//               Ready to Transform Your Business?
//             </motion.h2>
//             <motion.p 
//               variants={fadeInUp}
//               className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 sm:mb-10 max-w-2xl mx-auto px-2 leading-relaxed"
//             >
//               Join thousands of small business owners who are already using FahamPesa 
//               to streamline their operations and boost their profits.
//             </motion.p>

//             <motion.div 
//               variants={fadeInUp}
//               className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
//             >
//               {/* Play Store Button */}
//               <a 
//                 href="https://play.google.com/store/apps/details?id=com.fahampesa.app" 
//                 target="_blank" 
//                 rel="noopener noreferrer"
//                 className="group inline-flex items-center px-6 sm:px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
//               >
//                 <div className="flex items-center space-x-2 sm:space-x-3 mx-auto sm:mx-0">
//                   <div className="relative">
//                     <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8" />
//                   </div>
//                   <div className="text-left">
//                     <div className="text-xs text-gray-300 leading-tight">Get it on</div>
//                     <div className="text-base sm:text-lg font-semibold">Google Play</div>
//                   </div>
//                 </div>
//               </a>

//               {/* App Store Button */}
//               <button 
//                 onClick={() => setShowComingSoon(true)}
//                 className="group inline-flex items-center px-6 sm:px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
//               >
//                 <div className="flex items-center space-x-2 sm:space-x-3 mx-auto sm:mx-0">
//                   <Apple className="w-6 h-6 sm:w-8 sm:h-8" />
//                   <div className="text-left">
//                     <div className="text-xs text-gray-300 leading-tight">Download on the</div>
//                     <div className="text-base sm:text-lg font-semibold">App Store</div>
//                   </div>
//                 </div>
//               </button>
//             </motion.div>
          
//           </motion.div>
//         </div>
//       </section>

//       {/* Coming Soon Modal */}
//       {showComingSoon && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
//           <motion.div 
//             initial={{ opacity: 0, scale: 0.8, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             transition={{ type: "spring", damping: 20, stiffness: 300 }}
//             className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center shadow-2xl"
//           >
//             <Apple className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
//             <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Coming Soon to iOS</h3>
//             <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
//               We&apos;re working hard to bring FahamPesa to the App Store. 
//               In the meantime, you can download our Android app and start managing your business today!
//             </p>
//             <button 
//               onClick={() => setShowComingSoon(false)}
//               className="w-full px-6 py-4 bg-[#004AAD] text-white font-semibold rounded-xl hover:bg-[#003a8c] active:scale-95 transition-all duration-200 shadow-lg"
//             >
//               Got it, thanks!
//             </button>
//           </motion.div>
//         </div>
//       )}

//       {/* Footer */}
//       <footer id="contact" className="bg-gray-900 text-white py-12 sm:py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
//             {/* Brand */}
//             <div className="md:col-span-2">
//               <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">FahamPesa</h3>
//               <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-md leading-relaxed">
//                 Empowering small business owners across Kenya with smart, offline-first 
//                 sales and inventory management tools.
//               </p>
//               <div className="flex space-x-4">
//                 <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
//                   <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
//                   <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
//                   <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
//                 </a>
//               </div>
//             </div>

//             {/* Support */}
//             <div>
//               <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h4>
//               <ul className="space-y-2 sm:space-y-3">
//                 <li>
//                   <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
//                     Help Center
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
//                     Getting Started
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
//                     User Guide
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
//                     FAQ
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             {/* Contact */}
//             <div>
//               <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact</h4>
//               <ul className="space-y-2 sm:space-y-3">
//                 <li className="flex items-center">
//                   <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#FF9500] flex-shrink-0" />
//                   <a href="mailto:support@fahampesa.com" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors break-all">
//                     support@fahampesa.com
//                   </a>
//                 </li>
//                 <li className="flex items-center">
//                   <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#FF9500] flex-shrink-0" />
//                   <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
//                     WhatsApp Support
//                   </a>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
//             <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4 sm:mb-0">
//               &copy; 2024 FahamPesa. Built with ❤️ for small business owners in Kenya and beyond.
//             </p>
//             <div className="flex items-center space-x-4">
//               <a 
//                 href="/login" 
//                 className="text-gray-400 hover:text-[#FF9500] transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-800"
//               >
//                 Business Login
//               </a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }



'use client'

import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  BarChart3, 
  Package, 
  CheckCircle, 
  Download,
  Apple,
  PlayCircle,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Instagram,
  ArrowRight,
  Sun,
  WifiOff,
  Shield,
  Menu,
  X,
  UserPlus,
  Plus,
  TrendingUp,
  Play
} from 'lucide-react'
import { useState } from 'react'
import { DownloadModal } from '@/components/DownloadModal'

export default function LandingPage() {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-2 sm:space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg sm:text-xl">F</span>
              </div>
              <div className="hidden xs:block sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-[#004AAD]">FahamPesa</h1>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Smart Business Tools</p>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.nav 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <a href="#features" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
                Features
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
                Benefits
              </a>
              <a href="#download" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
                Download
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#004AAD] transition-colors font-medium">
                Contact
              </a>
            </motion.nav>

            {/* Mobile Menu Button & CTA */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="hidden sm:block"
              >
                <a 
                  href="/login"
                  className="text-[#004AAD] hover:text-[#FF9500] font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm sm:text-base"
                >
                  Login
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden sm:block"
              >
                <button 
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="bg-[#FF9500] text-black px-4 sm:px-6 py-2 rounded-xl font-semibold hover:bg-[#e6850e] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
                >
                  Download App
                </button>
              </motion.div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-[#004AAD] transition-colors hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#benefits" 
                className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits
              </a>
              <a 
                href="#download" 
                className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Download
              </a>
              <a 
                href="#contact" 
                className="block text-gray-700 hover:text-[#004AAD] hover:bg-gray-50 transition-all font-medium py-3 px-3 rounded-lg -mx-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <a 
                  href="/login"
                  className="block w-full bg-[#004AAD] text-white px-6 py-4 rounded-xl font-semibold hover:bg-[#003a8c] transition-all text-center shadow-md hover:shadow-lg transform hover:scale-[0.98] active:scale-95"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </a>
                <button 
                  className="block w-full bg-[#FF9500] text-black px-6 py-4 rounded-xl font-semibold hover:bg-[#e6850e] transition-all text-center shadow-md hover:shadow-lg transform hover:scale-[0.98] active:scale-95"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setIsDownloadModalOpen(true)
                  }}
                >
                  Download App
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#001122] via-[#004AAD] to-[#FF9500] text-white pt-14 sm:pt-16">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='27' r='1.5'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3Ccircle cx='67' cy='67' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[#FF9500] to-transparent rounded-full opacity-30"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[#0056CC] to-transparent rounded-full opacity-20"
            animate={{
              y: [0, 30, 0],
              rotate: [0, -360]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-white to-transparent rounded-full opacity-10"
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp} className="mb-4 sm:mb-6">
                <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-[#FF9500] text-black font-semibold text-xs sm:text-sm shadow-lg">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Smart Tools for Modern Businesses.
                </span>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
              >
                Powerful Sales and
                <span className="block text-[#FF9500]">Anywhere, Anytime</span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 sm:mb-10 leading-relaxed"
              >
                Fahampesa gives your business the tools to sell faster, track stock in real time, and stay in control anywhere. Secure, offline-first, and built to scale with you.
              </motion.p>

              {/* 3-Step Guide */}
              <motion.div 
                variants={fadeInUp}
                className="mb-8 sm:mb-10"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 text-center">Get started in 3 simple steps:</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-white">Sign up</span>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9500] rotate-90 sm:rotate-0" />
                  
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-white">Add products</span>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9500] rotate-90 sm:rotate-0" />
                  
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF9500] rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-white">Start selling</span>
                  </div>
                </div>
              </motion.div>

              {/* Main CTA Button */}
              <motion.div 
                variants={fadeInUp}
                className="text-center mb-6 sm:mb-8"
              >
                <a 
                  href="/login"
                  className="group inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 bg-[#FF9500] text-black font-bold text-lg sm:text-xl rounded-xl hover:bg-[#e6850e] transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-3xl"
                >
                  Sign in and start your first sale
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>

              {/* Secondary Actions */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              >
                <a 
                  href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#FF9500] text-[#FF9500] font-semibold rounded-xl hover:bg-[#FF9500] hover:text-black active:scale-95 transition-all duration-200 text-sm sm:text-base"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Download Android App
                </a>
                
                {/* Testimonial Video Button */}
                <button 
                  onClick={() => {
                    const video = document.getElementById('testimonial-video') as HTMLVideoElement;
                    if (video) {
                      video.play();
                      video.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-[#004AAD] active:scale-95 transition-all duration-200 text-sm sm:text-base"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Watch Testimonial
                </button>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-300"
              >
                <div className="flex items-center">
                  <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
                  works online and offline
                </div>
                <div className="flex items-center">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
                  Real-time reports and insights
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-[#FF9500]" />
                  Secure by design
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Dashboard Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative lg:order-2 mt-8 lg:mt-0"
            >
              {/* Pure Screenshot Display - Larger Size */}
              <div className="relative mx-auto max-w-4xl lg:max-w-5xl">
                <img 
                  src="/dashboard-screenshot.png" 
                  alt="FahamPesa Dashboard Preview" 
                  className="w-full h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-6 -right-6 bg-[#FF9500] text-black px-6 py-3 rounded-full text-base font-semibold shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Live Dashboard
              </motion.div>
              
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white text-[#004AAD] px-6 py-3 rounded-full text-base font-semibold shadow-lg"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Real-time Data
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Video Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
            >
              Hear from Our <span className="text-[#FF9500]">Happy Customers</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Real business owners sharing their success stories with FahamPesa
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="relative max-w-3xl mx-auto"
            >
              {/* Video Container */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video 
                  id="testimonial-video"
                  className="w-full h-auto"
                  controls
                  poster="/testimonial-thumbnail.png"
                  preload="metadata"
                >
                  <source src="/testimonial-mohammed.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => {
                      const video = document.getElementById('testimonial-video') as HTMLVideoElement;
                      if (video) {
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF9500] rounded-full flex items-center justify-center hover:bg-[#e6850e] transition-colors shadow-lg"
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <motion.div 
                variants={fadeInUp}
                className="mt-6 sm:mt-8 flex items-center justify-center space-x-3 sm:space-x-4"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="text-left">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900">Mohammed</h4>
                  <p className="text-sm sm:text-base text-gray-600">Small Business Owner</p>
                </div>
              </motion.div>

              {/* Quote */}
              <motion.blockquote 
                variants={fadeInUp}
                className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-700 italic max-w-2xl mx-auto leading-relaxed"
              >
                "FahamPesa has completely transformed how I manage my business. The offline features are a game-changer!"
              </motion.blockquote>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-8 sm:mb-12 lg:mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 leading-relaxed">
              From inventory management to sales tracking, FahamPesa provides all the tools 
              small business owners need to succeed in today&apos;s competitive market.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {[
              {
                icon: Package,
                title: "Smart Inventory Management",
                description: "Track your products, manage stock levels, and get low-stock alerts. Perfect for kiosks and small shops."
              },
              {
                icon: ShoppingCart,
                title: "Quick Sales Recording",
                description: "Record sales instantly and auto-update inventory. Optimized for fast transactions in busy environments."
              },
              {
                icon: BarChart3,
                title: "Daily & Weekly Reports",
                description: "Get insights into your business performance with detailed analytics and export reports via WhatsApp or PDF."
              },
              {
                icon: WifiOff,
                title: "Offline-First Design",
                description: "Works completely offline, syncs automatically when connected. Never lose a sale due to poor internet."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 active:scale-[0.98] cursor-pointer"
              >
                <div className="bg-[#004AAD] text-white w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#FF9500] group-hover:text-black transition-all duration-300 shadow-md">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 leading-tight">
                Designed for <span className="text-[#FF9500]">Real-World</span> Business Challenges
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-2 leading-relaxed">
                We understand the unique challenges small business owners face in Kenya. 
                That&apos;s why FahamPesa is built with features that actually matter for your daily operations.
              </p>
              
              <div className="space-y-4 sm:space-y-6 px-2">
                {[
                  {
                    icon: Sun,
                    title: "Sunlight Optimized",
                    description: "High contrast design perfect for outdoor markets and direct sunlight use."
                  },
                  {
                    icon: CheckCircle,
                    title: "Budget Phone Friendly",
                    description: "Optimized for Tecno, Infinix, Itel, and other budget Android devices."
                  },
                  {
                    icon: Shield,
                    title: "Secure & Private",
                    description: "Local data encryption and secure cloud sync with Firebase authentication."
                  }
                ].map((benefit, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start space-x-3 sm:space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-[#004AAD] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">{benefit.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative mt-8 lg:mt-0"
            >
              {/* Stats Cards */}
              <div className="bg-gradient-to-br from-[#004AAD] to-[#0056CC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center lg:text-left">Perfect for Kenyan Businesses</h3>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">99%</div>
                    <div className="text-xs sm:text-sm text-gray-200 leading-tight">works online and offline</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">5s</div>
                    <div className="text-xs sm:text-sm text-gray-200 leading-tight">Sale Recording</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">24/7</div>
                    <div className="text-xs sm:text-sm text-gray-200 leading-tight">Real-time reports and insights</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF9500] mb-1 sm:mb-2">100%</div>
                    <div className="text-xs sm:text-sm text-gray-200 leading-tight">Secure by design</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reports & Analytics Showcase */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Laptop with Reports Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Modern Laptop Mockup */}
              <div className="relative mx-auto max-w-3xl">
                {/* Laptop Screen */}
                <div className="relative bg-gray-900 rounded-t-2xl p-4 shadow-2xl">
                  {/* Screen Bezel */}
                  <div className="bg-black rounded-xl p-2">
                    {/* Reports Screenshot */}
                    <div className="relative overflow-hidden rounded-lg bg-white">
                      <motion.img 
                        src="/reports-screenshot.png" 
                        alt="FahamPesa Reports & Analytics" 
                        className="w-full h-auto object-cover rounded-lg"
                        initial={{ scale: 1.1 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      {/* Screen Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent rounded-lg"></div>
                    </div>
                  </div>
                  
                  {/* Camera */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
                </div>
                
                {/* Laptop Base */}
                <div className="bg-gray-800 h-8 rounded-b-2xl shadow-lg relative">
                  {/* Trackpad */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-gray-600 rounded-md"></div>
                </div>
                
                {/* Laptop Shadow */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full h-12 bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-full blur-xl"></div>
              </div>

              {/* Animated Data Points */}
              <motion.div
                className="absolute top-8 -right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                📈 Sales Up 24%
              </motion.div>
              
              <motion.div
                className="absolute bottom-12 -left-6 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
                animate={{ 
                  y: [0, 12, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                📊 Live Data
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-8 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg"
                animate={{ 
                  x: [0, -8, 0],
                  rotate: [0, -3, 0]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                📋 Reports
              </motion.div>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerChildren}
              >
                <motion.h2 
                  variants={fadeInUp}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
                >
                  Powerful <span className="text-[#FF9500]">Reports & Analytics</span>
                </motion.h2>
                
                <motion.p 
                  variants={fadeInUp}
                  className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed"
                >
                  Get deep insights into your business performance with comprehensive reports, 
                  real-time analytics, and actionable data to help you make informed decisions.
                </motion.p>

                <motion.div 
                  variants={fadeInUp}
                  className="space-y-4 sm:space-y-6 mb-6 sm:mb-8"
                >
                  {[
                    {
                      icon: BarChart3,
                      title: "Sales Analytics",
                      description: "Track daily, weekly, and monthly sales performance with beautiful charts and graphs."
                    },
                    {
                      icon: TrendingUp,
                      title: "Growth Insights",
                      description: "Identify trends, peak sales hours, and best-selling products to optimize your business."
                    },
                    {
                      icon: Package,
                      title: "Inventory Reports",
                      description: "Monitor stock levels, track product movement, and get alerts for low inventory."
                    }
                  ].map((feature, index) => (
                    <motion.div 
                      key={index}
                      variants={fadeInUp}
                      className="flex items-start space-x-3 sm:space-x-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                      <div className="bg-[#004AAD] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">{feature.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <a 
                    href="/login"
                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-[#FF9500] text-black font-semibold rounded-xl hover:bg-[#e6850e] transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Explore Analytics Dashboard
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 px-2 leading-tight"
            >
              Ready to Transform Your Business?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 sm:mb-10 max-w-2xl mx-auto px-2 leading-relaxed"
            >
              Join thousands of small business owners who are already using FahamPesa 
              to streamline their operations and boost their profits.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
            >
              {/* Play Store Button */}
              <a 
                href="https://play.google.com/store/apps/details?id=com.fahampesa.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group inline-flex items-center px-6 sm:px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mx-auto sm:mx-0">
                  <div className="relative">
                    <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-300 leading-tight">Get it on</div>
                    <div className="text-base sm:text-lg font-semibold">Google Play</div>
                  </div>
                </div>
              </a>

              {/* App Store Button */}
              <button 
                onClick={() => setShowComingSoon(true)}
                className="group inline-flex items-center px-6 sm:px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mx-auto sm:mx-0">
                  <Apple className="w-6 h-6 sm:w-8 sm:h-8" />
                  <div className="text-left">
                    <div className="text-xs text-gray-300 leading-tight">Download on the</div>
                    <div className="text-base sm:text-lg font-semibold">App Store</div>
                  </div>
                </div>
              </button>
            </motion.div>
          
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center shadow-2xl"
          >
            <Apple className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Coming Soon to iOS</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              We&apos;re working hard to bring FahamPesa to the App Store. 
              In the meantime, you can download our Android app and start managing your business today!
            </p>
            <button 
              onClick={() => setShowComingSoon(false)}
              className="w-full px-6 py-4 bg-[#004AAD] text-white font-semibold rounded-xl hover:bg-[#003a8c] active:scale-95 transition-all duration-200 shadow-lg"
            >
              Got it, thanks!
            </button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">FahamPesa</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-md leading-relaxed">
                Empowering small business owners across Kenya with smart, offline-first 
                sales and inventory management tools.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
                  <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
                  <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#FF9500] transition-colors p-2 rounded-lg hover:bg-gray-800">
                  <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
                    Getting Started
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
                    User Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors block py-1 hover:bg-gray-800 px-2 rounded -mx-2">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#FF9500] flex-shrink-0" />
                  <a href="mailto:support@fahampesa.com" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors break-all">
                    support@fahampesa.com
                  </a>
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#FF9500] flex-shrink-0" />
                  <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                    WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4 sm:mb-0">
              &copy; 2024 FahamPesa. Built with ❤️ for small business owners in Kenya and beyond.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="/login" 
                className="text-gray-400 hover:text-[#FF9500] transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                Business Login
              </a>
            </div>
          </div>
        </div>
      </footer>
      <DownloadModal open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen} />
    </div>
  )
}
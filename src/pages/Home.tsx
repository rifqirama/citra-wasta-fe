
import HeroSection from '../components/fragments/HeroSection'
import Navbar from '../components/fragments/Navbar'
import WastraProses from '../components/fragments/WastraProses'
import BenefitsSection from '../components/fragments/BenefitsSection'
import CallToAction from '../components/fragments/CallToAction'
import Footer from '../components/fragments/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import { Toaster } from "react-hot-toast";

const Home = () => {
  return (
    <div className="bg-white dark:bg-gray-900 transition-colors min-h-screen">
        <ScrollToTop />
        <Navbar />
        <Toaster position="top-center" />
        <HeroSection />
        <WastraProses />
        <BenefitsSection />
        <CallToAction />
        <Footer />
    </div>
  )
}

export default Home
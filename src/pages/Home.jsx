import Navbar from '@/components/Navbar';
import HeroSearch from '@/components/sections/HeroSearch';
import TrustBar from '@/components/sections/TrustBar';
import FeaturedOffers from '@/components/sections/FeaturedOffers';
import Destinations from '@/components/sections/Destinations';
import Inspirations from '@/components/sections/Inspirations';
import SpecialEvents from '@/components/sections/SpecialEvents';
import CruiseLines from '@/components/sections/CruiseLines';
import WhyUs from '@/components/sections/WhyUs';
import Reviews from '@/components/sections/Reviews';
import Newsletter from '@/components/sections/Newsletter';
import ContactBanner from '@/components/sections/ContactBanner';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSearch />
      <TrustBar />
      <FeaturedOffers />
      <Destinations />
      <Inspirations />
      <SpecialEvents />
      <CruiseLines />
      <WhyUs />
      <Reviews />
      <Newsletter />
      <ContactBanner />
      <Footer />
    </div>
  );
}
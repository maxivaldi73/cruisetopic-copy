import HeroSearch from '@/components/sections/HeroSearch';
import FeaturedOffers from '@/components/sections/FeaturedOffers';
import Destinations from '@/components/sections/Destinations';
import Inspirations from '@/components/sections/Inspirations';
import SpecialEvents from '@/components/sections/SpecialEvents';
import CruiseLines from '@/components/sections/CruiseLines';
import WhyUs from '@/components/sections/WhyUs';
import Reviews from '@/components/sections/Reviews';
import Newsletter from '@/components/sections/Newsletter';

export default function Home() {
  return (
    <div>
      <HeroSearch />
      <FeaturedOffers />
      <Destinations />
      <Inspirations />
      <SpecialEvents />
      <CruiseLines />
      <WhyUs />
      <Reviews />
      <Newsletter />
    </div>
  );
}
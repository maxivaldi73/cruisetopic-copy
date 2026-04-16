import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import OfferMiniCard from '@/components/OfferMiniCard';

export default function FeaturedOffers() {
  const offers = [
    {
      id: 1,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=200&h=150&fit=crop&q=80',
      stops: [
        { name: 'Porto', arrival: '', departure: '09:00' },
        { name: 'Las Palmas', arrival: '09:00', departure: '23:00' },
        { name: 'La Gomera - Islas Canarias', arrival: '10:00', departure: '20:00' },
        { name: 'Santa Cruz de la Palma', arrival: '10:00', departure: '23:00' },
        { name: 'Santa Cruz de Tenerife', arrival: '06:00', departure: '—' },
        { name: 'Agadir', arrival: '19:00', departure: '—' },
      ],
    },
    {
      id: 2,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 3,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 4,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 5,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 6,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 7,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 8,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 9,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 10,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 11,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop&q=80',
    },
    {
      id: 12,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      mapImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=200&h=150&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-10 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          <span className="text-primary italic">Offerte</span> all inclusive
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <OfferMiniCard key={offer.id} offer={offer} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/offers">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 rounded-full">
              Vedi tutte le offerte →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
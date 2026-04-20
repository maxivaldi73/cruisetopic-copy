import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ship, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      stops: ['Porto', 'Las Palmas', 'La Gomera', 'Santa Cruz de la Palma', 'Santa Cruz de Tenerife'],
    },
    {
      id: 2,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
      stops: ['Porto', 'Las Palmas', 'La Gomera'],
    },
    {
      id: 3,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      stops: ['Porto', 'Las Palmas', 'La Gomera'],
    },
    {
      id: 4,
      destination: 'Spagna e Baleari',
      nights: 7,
      date: '16/12/2023',
      departure: 'Savona',
      ship: 'Costa Smeralda',
      price: 509,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
      stops: ['Porto', 'Las Palmas', 'La Gomera'],
    },
  ];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Offerte all inclusive</h2>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
              <span className="text-sm text-muted-foreground ml-2">{offers.length} crociere in promozione</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <img src={offer.image} alt={offer.destination} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{offer.destination}</h3>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {offer.nights} notti • {offer.date}
                </div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {offer.departure}
                </div>
                <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                  <Ship className="w-3 h-3" /> {offer.ship}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-semibold">Tappe:</span> {offer.stops.join(' • ')}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">€{offer.price}</span>
                    <span className="text-xs text-muted-foreground"> a persona</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/offers">
            <Button variant="outline" size="lg">Vedi tutte le offerte</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
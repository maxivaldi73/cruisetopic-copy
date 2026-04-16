import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ship, MapPin, Calendar } from 'lucide-react';

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
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-2">Offerte all inclusive</h2>
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{ offers.length } crociere in promozione</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted overflow-hidden">
                <img 
                  src={offer.image} 
                  alt={offer.destination}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-3">{offer.destination}</h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{offer.nights} notti • {offer.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{offer.departure}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    <span>{offer.ship}</span>
                  </div>
                </div>

                <div className="border-t pt-3 mb-3">
                  <p className="text-sm text-muted-foreground mb-1">Tappe:</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {offer.stops.join(' • ')}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">€{offer.price}</span>
                  <span className="text-xs text-muted-foreground">a persona</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline">Vedi tutte le offerte</Button>
        </div>
      </div>
    </section>
  );
}
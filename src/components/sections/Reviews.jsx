import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Reviews() {
  const reviews = [
    {
      name: 'Sheldon Cooper',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Isole Baleari',
      ship: 'Costa Toscana',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    },
    {
      name: 'Amy Farrah F.',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Mediterraneo',
      ship: 'MSC Romantica',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    },
    {
      name: 'Frank Gallagher',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Fiordi Norvegesi',
      ship: 'Royal Caribbean Oceanica',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    },
    {
      name: 'Fiona Gallagher',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Maldive',
      ship: 'Costa Deliziosa',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12">Recensioni</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {reviews.map((review, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={review.image}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{review.name}</p>
                  <p className="text-xs text-primary font-medium">{review.badge}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">{review.destination}</p>
                <p className="text-sm font-semibold">{review.ship}</p>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{review.text}</p>
              
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline">Vedi tutte le recensioni</Button>
        </div>
      </div>
    </section>
  );
}
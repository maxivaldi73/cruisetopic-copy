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
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Recensioni</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={review.image} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm">{review.name}</div>
                  <div className="text-xs text-primary font-bold">{review.badge}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{review.destination} • {review.ship}</div>
              <div className="flex mb-2">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{review.text}</p>
              <div className="text-xs text-muted-foreground">{review.date}</div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline">Vedi tutte le recensioni</Button>
        </div>
      </div>
    </section>
  );
}
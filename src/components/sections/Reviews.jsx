import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

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
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&q=80',
    },
    {
      name: 'Amy Farrah F.',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Mediterraneo',
      ship: 'MSC Romantica',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&q=80',
    },
    {
      name: 'Frank Gallagher',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Fiordi Norvegesi',
      ship: 'Royal Caribbean Oceanica',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&q=80',
    },
    {
      name: 'Fiona Gallagher',
      badge: 'TOP CONTRIBUTOR',
      destination: 'Maldive',
      ship: 'Costa Deliziosa',
      date: 'settembre 2023',
      rating: 5,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-12 px-4" style={{ background: 'linear-gradient(180deg, #E8F4FC 0%, #D6EEF9 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">Recensioni</span>
            <div className="flex items-center gap-0.5 px-2 py-1 bg-white rounded">
              <Star className="w-4 h-4 text-green-500 fill-green-500" />
              <span className="font-bold text-sm">Trustpilot</span>
            </div>
          </div>
          <Button variant="link" className="text-primary font-semibold">
            Vedi tutte le recensioni →
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-4">
              <div className="mb-2">
                <div className="text-sm font-bold text-foreground">{review.destination}</div>
                <div className="text-xs text-muted-foreground">{review.ship}</div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{review.text}</p>

              <div className="flex mb-2">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                ))}
              </div>

              <div className="text-[10px] text-muted-foreground mb-3">{review.date}</div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <img src={review.image} alt={review.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-xs text-foreground">{review.name}</div>
                  <div className="text-[10px] font-bold text-primary">{review.badge}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
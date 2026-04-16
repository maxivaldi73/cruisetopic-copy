import { Button } from '@/components/ui/button';

export default function Destinations() {
  const destinations = [
    {
      name: 'Australia e Isole del Pacifico',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop',
    },
    {
      name: 'Tropici',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    },
    {
      name: 'Fiordi Norvegesi',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Destinazioni</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {destinations.map((dest, idx) => (
            <div 
              key={idx}
              className="relative h-64 rounded-lg overflow-hidden cursor-pointer group"
            >
              <img 
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">{dest.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline">Vedi tutte le destinazioni</Button>
        </div>
      </div>
    </section>
  );
}
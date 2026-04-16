import { Button } from '@/components/ui/button';

export default function Destinations() {
  const destinations = [
    {
      name: 'Australia e Isole del Pacifico',
      image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Tropici',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Fiordi Norvegesi',
      image: 'https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=600&h=400&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-10 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Destinazioni</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {destinations.map((dest, idx) => (
            <div
              key={idx}
              className="relative h-52 rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-bold text-lg drop-shadow">{dest.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 rounded-full">
            Vedi tutte le destinazioni →
          </Button>
        </div>
      </div>
    </section>
  );
}
import { Button } from '@/components/ui/button';

export default function SpecialEvents() {
  const events = [
    {
      name: 'Natale',
      image: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Pasqua',
      image: 'https://images.unsplash.com/photo-1491904768633-2b7e3e7fede5?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Capodanno',
      image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&h=400&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-10 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Eventi speciali</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((event, idx) => (
            <div
              key={idx}
              className="relative h-52 rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={event.image}
                alt={event.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-bold text-xl drop-shadow">{event.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 rounded-full">
            Vedi tutti gli eventi →
          </Button>
        </div>
      </div>
    </section>
  );
}
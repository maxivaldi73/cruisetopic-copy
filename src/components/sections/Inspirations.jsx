import { Button } from '@/components/ui/button';

export default function Inspirations() {
  const inspirations = [
    {
      name: 'Crociere di Avventura',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Crociere Culturali',
      image: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=600&h=400&fit=crop&q=80',
    },
    {
      name: 'Crociere Fluviali',
      image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-10 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Ispirazioni</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inspirations.map((item, idx) => (
            <div
              key={idx}
              className="relative h-52 rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-bold text-lg drop-shadow">{item.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 rounded-full">
            Lasciati ispirare →
          </Button>
        </div>
      </div>
    </section>
  );
}
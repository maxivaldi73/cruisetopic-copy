import { Button } from '@/components/ui/button';

export default function Inspirations() {
  const inspirations = [
    {
      name: 'Crociere di Avventura',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    },
    {
      name: 'Crociere Culturali',
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=300&fit=crop',
    },
    {
      name: 'Crociere Fluviali',
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500&h=300&fit=crop',
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Lasciati ispirare</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {inspirations.map((insp, idx) => (
            <div 
              key={idx}
              className="relative h-64 rounded-lg overflow-hidden cursor-pointer group"
            >
              <img 
                src={insp.image}
                alt={insp.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">{insp.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline">Visualizza tutti</Button>
        </div>
      </div>
    </section>
  );
}
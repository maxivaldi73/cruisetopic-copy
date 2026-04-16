export default function CruiseLines() {
  const lines = [
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
    'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop',
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-accent/10 via-accent/20 to-accent/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Compagnie</h2>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div>
              <p className="text-2xl font-bold text-foreground">28 navi</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">2463 partenze all'anno</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">692 rotte</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center">
          {lines.map((_, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-lg p-4 h-24 flex items-center justify-center hover:shadow-md transition-shadow"
            >
              <div className="text-2xl font-bold text-primary">Logo</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
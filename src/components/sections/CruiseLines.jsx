export default function CruiseLines() {
  const lines = [
    { name: 'Costa', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'MSC', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Royal Caribbean', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Norwegian', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Celebrity', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Princess', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Carnival', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
    { name: 'Holland America', logo: 'https://images.unsplash.com/photo-1557696172-e657a3b9d76f?w=200&h=100&fit=crop' },
  ];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Compagnie</h2>
          <div className="flex justify-center gap-12 text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">28</div>
              <div className="text-sm">navi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">2463</div>
              <div className="text-sm">partenze all'anno</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">692</div>
              <div className="text-sm">rotte</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {lines.map((line, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <img src={line.logo} alt={line.name} className="w-16 h-10 object-cover rounded mb-2" />
              <span className="text-xs text-muted-foreground text-center">{line.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
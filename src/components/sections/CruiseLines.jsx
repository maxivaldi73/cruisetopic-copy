import { Button } from '@/components/ui/button';

export default function CruiseLines() {
  const lines = [
    { name: 'Costa', abbr: 'C', color: '#003087' },
    { name: 'MSC', abbr: 'MSC', color: '#0066CC' },
    { name: 'Norwegian', abbr: 'NCL', color: '#E30613' },
    { name: 'Celebrity Cruise', abbr: 'X', color: '#003087' },
    { name: 'Carnival', abbr: 'X', color: '#CC0000' },
    { name: 'Princess Cruises', abbr: 'P', color: '#00529B' },
    { name: 'Holland America', abbr: 'HA', color: '#003087' },
    { name: 'Costa', abbr: 'C', color: '#003087' },
    { name: 'MSC', abbr: 'MSC', color: '#0066CC' },
    { name: 'Norwegian', abbr: 'NCL', color: '#E30613' },
    { name: 'Carnival', abbr: 'X', color: '#CC0000' },
    { name: 'Princess Cruises', abbr: 'P', color: '#00529B' },
    { name: 'Costa', abbr: 'C', color: '#003087' },
    { name: 'Celebrity Cruise', abbr: 'X', color: '#003087' },
    { name: 'MSC', abbr: 'MSC', color: '#0066CC' },
    { name: 'Holland America', abbr: 'HA', color: '#003087' },
  ];

  return (
    <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, hsl(221, 90%, 40%) 0%, hsl(195, 80%, 48%) 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Compagnie</h2>
          <div className="hidden md:flex gap-8 text-white">
            <div className="text-center">
              <div className="text-2xl font-black">28</div>
              <div className="text-xs text-white/70">navi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">2463</div>
              <div className="text-xs text-white/70">partenze all'anno</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">692</div>
              <div className="text-xs text-white/70">rotte</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div
                className="w-10 h-8 rounded flex items-center justify-center mb-1.5 text-white font-black text-xs"
                style={{ backgroundColor: line.color }}
              >
                {line.abbr}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{line.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button className="bg-white text-primary hover:bg-white/90 font-semibold px-6 rounded-full">
            Crociere Last Minute
          </Button>
        </div>
      </div>
    </section>
  );
}
import { Star } from 'lucide-react';

export default function TrustBar() {
  return (
    <div className="bg-muted border-b">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 text-sm">
        <span className="font-semibold text-foreground">Eccezionale</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-green-500 w-5 h-5 flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">1.140 recensioni su</span>
        <span className="font-bold text-foreground flex items-center gap-0.5">
          <Star className="w-4 h-4 text-green-500 fill-green-500" />
          Trustpilot
        </span>
      </div>
    </div>
  );
}
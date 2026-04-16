import { useState } from 'react';

export default function OfferMiniCard({ offer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-border hover:shadow-lg transition-all cursor-pointer overflow-hidden group relative"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="p-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <img
              src={offer.mapImage}
              alt=""
              className="w-16 h-12 rounded object-cover flex-shrink-0"
            />
            <div>
              <h3 className="font-bold text-sm text-foreground leading-tight">{offer.destination}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {offer.nights} notti
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
          <span>{offer.date}</span>
          <span>•</span>
          <span>{offer.departure}</span>
        </div>

        {/* Ship and price row */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
              C
            </div>
            <span className="text-xs text-muted-foreground">{offer.ship}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">da</div>
            <div className="text-xs text-muted-foreground">a persona</div>
            <div className="text-xl font-black text-primary">{offer.price}€</div>
          </div>
        </div>
      </div>

      {/* Expanded itinerary overlay */}
      {expanded && offer.stops && (
        <div className="absolute inset-0 bg-white border border-primary rounded-xl shadow-xl z-10 p-3.5 overflow-auto">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">{offer.destination}</h3>
              <div className="text-xs text-muted-foreground mt-0.5">{offer.nights} notti • {offer.date} • {offer.departure}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">da a persona</div>
              <div className="text-lg font-black text-primary">{offer.price}€</div>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5 flex gap-16">
            <span>Porto</span>
            <span className="ml-auto">Arrivo</span>
            <span>Partenza</span>
          </div>
          <div className="space-y-1">
            {offer.stops.map((stop, i) => (
              <div key={i} className="flex items-center text-xs text-foreground">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="truncate">{stop.name}</span>
                </div>
                <span className="text-muted-foreground w-12 text-right">{stop.arrival || '—'}</span>
                <span className="text-muted-foreground w-12 text-right">{stop.departure || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
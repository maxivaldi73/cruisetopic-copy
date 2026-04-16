import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MapPin, Ship, Share2, ChevronDown } from 'lucide-react';

export default function CruiseCard({ cruise }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex gap-6 p-6">
        {/* Map Image */}
        <div className="w-64 flex-shrink-0">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            <img
              src={cruise.mapImage}
              alt={cruise.destination}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-sm font-semibold mb-2">{cruise.destination.split(' ')[0]}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{cruise.destination}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Ship className="w-4 h-4" />
                <span>{cruise.ship}</span>
                <span>•</span>
                <span>{cruise.duration} notti</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLiked(!liked)}
                className={liked ? 'text-red-500' : ''}
              >
                <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <div className="text-muted-foreground">Partenza</div>
              <div className="font-semibold">{cruise.departure} • {cruise.departureDate}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Rotta</div>
              <div className="font-semibold">{cruise.route.join(', ')}</div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {cruise.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-primary">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dates and Prices */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Altre date disponibili:</div>
            <div className="flex gap-4">
              {[cruise.departureDate, ...cruise.nextDates].map((date, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-muted-foreground">{date}</div>
                  <div className="text-2xl font-bold text-primary">€889</div>
                  <div className="text-xs">a persona</div>
                </div>
              ))}
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">MIGLIOR PREZZO</span>
              <div className="text-3xl font-bold text-primary">€{cruise.price}</div>
              <div className="text-xs text-muted-foreground">a persona</div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                Blocca l'offerta
              </Button>
              <Button variant="outline" size="icon" onClick={() => setExpanded(!expanded)}>
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Info */}
      {expanded && (
        <div className="border-t p-6 bg-accent/5">
          <p className="text-sm text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam velit dui, rhoncus tempor metus nec, viverra finibus nunc.
          </p>
        </div>
      )}
    </Card>
  );
}
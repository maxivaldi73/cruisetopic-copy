import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/SearchBar';
import FilterSidebar from '@/components/FilterSidebar';
import CruiseCard from '@/components/CruiseCard';
import { ChevronDown, MapPin, Ship } from 'lucide-react';

const mockCruises = [
  {
    id: 1,
    destination: 'Mediterraneo da Genova',
    ship: 'Costa Smeralda',
    duration: 7,
    departure: 'Savona',
    departureDate: '1 GIU 2027',
    nextDates: ['8 GIU 2027'],
    route: ['Italia', 'Francia', 'Spagna', 'Portogallo', 'Inghilterra'],
    amenities: ['Bambini gratis fino a 12 anni', 'Voli disponibili', 'Internet a bordo', 'Animazione a bordo', 'Mini Club bambini gratis', 'Pensione completa'],
    price: 856,
    rating: 5,
    reviews: 15,
    mapImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    destination: 'Mediterraneo da Genova',
    ship: 'Costa Smeralda',
    duration: 7,
    departure: 'Savona',
    departureDate: '1 GIU 2027',
    nextDates: ['8 GIU 2027'],
    route: ['Italia', 'Francia', 'Spagna', 'Portogallo', 'Inghilterra'],
    amenities: ['Bambini gratis fino a 12 anni', 'Voli disponibili', 'Internet a bordo'],
    price: 856,
    rating: 5,
    reviews: 34,
    mapImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
];

export default function SearchResults() {
  const [sortBy, setSortBy] = useState('popularity');
  const [cruises, setCruises] = useState(mockCruises);
  const [filters, setFilters] = useState({
    when: [],
    priceRange: [150, 900],
    duration: [3, 10],
    companies: [],
    ships: [],
    ports: [],
    destinations: [],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <div className="bg-primary text-white py-6">
        <SearchBar />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Eccelente</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-green-500">★</span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">1.148 recensioni su Trustpilot</span>
            </div>
            <h1 className="text-2xl font-bold">345 crociere in: Mediterraneo</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordina per</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="popularity">Popolarità</option>
              <option value="price-low">Prezzo: Basso</option>
              <option value="price-high">Prezzo: Alto</option>
              <option value="rating">Valutazione</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="space-y-6">
              {cruises.map((cruise) => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" className="px-8">
                Carica altre offerte
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-accent py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Un nostro consulente ti aiuterà ad selezionare esattamente ciò di cui hai bisogno. Siamo qui per aiutarti!
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            Chiama un consulente
          </Button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/SearchBar';
import FilterSidebar from '@/components/FilterSidebar';
import CruiseCard from '@/components/CruiseCard';

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
      <div className="bg-primary py-8">
        <SearchBar />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-green-600">Eccelente</span>
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
              <span className="text-sm text-muted-foreground">1.148 recensioni su Trustpilot</span>
            </div>
            <h1 className="text-2xl font-bold">345 crociere in: Mediterraneo</h1>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="popularity">Popolarità</option>
            <option value="price-asc">Prezzo: Basso</option>
            <option value="price-desc">Prezzo: Alto</option>
            <option value="rating">Valutazione</option>
          </select>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Results Grid */}
          <div className="flex-1 space-y-4">
            {cruises.map((cruise) => (
              <CruiseCard key={cruise.id} cruise={cruise} />
            ))}

            {/* Load More */}
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                Carica altre offerte
              </Button>
            </div>

            {/* CTA Section */}
            <div className="bg-primary text-primary-foreground rounded-xl p-8 text-center">
              <p className="mb-4">Un nostro consulente ti aiuterà ad selezionare esattamente ciò di cui hai bisogno. Siamo qui per aiutarti!</p>
              <Button variant="secondary">Chiama un consulente</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
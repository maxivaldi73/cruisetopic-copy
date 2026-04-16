import React from 'react';
import { Button } from '@/components/ui/button';

export default function OfferCard({ offer }) {
  return (
    <div className="relative rounded-lg overflow-hidden group cursor-pointer h-64">
      {/* Background Image */}
      <img 
        src={offer.image}
        alt={offer.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      {/* Badge */}
      {offer.badge && (
        <div className="absolute top-4 right-4">
          {offer.badge.type === 'discount' && (
            <div className="bg-blue-600 rounded-full px-6 py-4 text-center">
              <div className="text-3xl font-bold text-white">{offer.badge.text}</div>
              <div className="text-xs text-white">{offer.badge.label}</div>
            </div>
          )}
          {offer.badge.type === 'special' && (
            <div className="bg-cyan-400 rounded-full px-4 py-2 text-center font-bold text-blue-900 text-xs">
              {offer.badge.text}
            </div>
          )}
          {offer.badge.type === 'limited' && (
            <div className="bg-blue-600 rounded-full px-4 py-2 text-center">
              <div className="text-xs font-bold text-white">Ancora</div>
              <div className="text-sm font-bold text-white">{offer.badge.text}</div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        {/* Season */}
        <div className="text-xs text-white/70 font-semibold">{offer.season}</div>

        {/* Title and Stats */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{offer.title}</h3>
          
          <div className="flex gap-6 mb-6 text-white text-sm">
            <div>
              <div className="text-2xl font-bold">{offer.cruises}</div>
              <div className="text-xs text-white/70">crociere</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{offer.companies}</div>
              <div className="text-xs text-white/70">compagnie</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white text-xs line-clamp-2 mb-4 text-white/90">
            {offer.description}
          </p>

          {/* CTA Button */}
          <Button className="bg-white text-primary hover:bg-white/90 font-semibold w-full sm:w-auto">
            Prenota adesso
          </Button>
        </div>
      </div>
    </div>
  );
}
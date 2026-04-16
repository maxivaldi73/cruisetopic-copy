import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar, Banknote, Clock, Ship, Anchor, MapPin } from 'lucide-react';

export default function FilterSidebar({ filters, setFilters }) {
  const companies = [
    { label: 'Costa Crociere', value: 'costa', count: 120 },
    { label: 'Norwegian Cruise Line', value: 'norwegian', count: 5 },
    { label: 'MSC', value: 'msc', count: 35 },
    { label: 'Celebrity Cruise', value: 'celebrity', count: 1 },
  ];

  const ships = [
    { label: 'Costa Fortuna', value: 'costa-fortuna', count: 80 },
    { label: 'Costa Fascinosa', value: 'costa-fascinosa', count: 5 },
    { label: 'Costa Pacifica', value: 'costa-pacifica', count: 5 },
    { label: 'Costa Deliziosa', value: 'costa-deliziosa', count: 2 },
  ];

  const ports = [
    { label: 'Civitavecchia Roma', value: 'civitavecchia', count: 120 },
    { label: 'Catania', value: 'catania', count: 5 },
    { label: 'Cagliari', value: 'cagliari', count: 35 },
  ];

  return (
    <div className="space-y-6">
      {/* QUANDO */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          QUANDO
        </h3>
        <div className="bg-accent rounded-lg p-4">
          {/* Calendar would go here - simplified */}
          <div className="text-sm text-muted-foreground">
            Seleziona date dal calendario
          </div>
        </div>
      </div>

      {/* PREZZO */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          PREZZO (notte a persona)
        </h3>
        <div className="space-y-3">
          <Slider 
            defaultValue={[150, 900]} 
            min={0} 
            max={2000} 
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm">
            <span>€150</span>
            <span>€900</span>
          </div>
        </div>
      </div>

      {/* DURATA */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          DURATA (giorni)
        </h3>
        <div className="space-y-3">
          <Slider 
            defaultValue={[3, 10]} 
            min={1} 
            max={30} 
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm">
            <span>3 giorni</span>
            <span>10 giorni</span>
          </div>
        </div>
      </div>

      {/* COMPAGNIA */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Ship className="w-4 h-4" />
          COMPAGNIA
        </h3>
        <div className="space-y-2">
          {companies.map((company) => (
            <div key={company.value} className="flex items-center gap-2">
              <Checkbox id={company.value} />
              <label htmlFor={company.value} className="text-sm cursor-pointer flex-1">
                {company.label}
              </label>
              <span className="text-xs text-muted-foreground">({company.count})</span>
            </div>
          ))}
        </div>
        <button className="text-sm text-primary mt-2">più opzioni</button>
      </div>

      {/* NAVE */}
      <div>
        <h3 className="font-semibold mb-4">NAVE</h3>
        <div className="space-y-2">
          {ships.map((ship) => (
            <div key={ship.value} className="flex items-center gap-2">
              <Checkbox id={ship.value} />
              <label htmlFor={ship.value} className="text-sm cursor-pointer flex-1">
                {ship.label}
              </label>
              <span className="text-xs text-muted-foreground">({ship.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* PORTO DI PARTENZA */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Anchor className="w-4 h-4" />
          PORTO DI PARTENZA
        </h3>
        <div className="space-y-2">
          {ports.map((port) => (
            <div key={port.value} className="flex items-center gap-2">
              <Checkbox id={port.value} />
              <label htmlFor={port.value} className="text-sm cursor-pointer flex-1">
                {port.label}
              </label>
              <span className="text-xs text-muted-foreground">({port.count})</span>
            </div>
          ))}
        </div>
        <button className="text-sm text-primary mt-2">più opzioni</button>
      </div>

      {/* LOCALITTA' VISITABILI */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          LOCALITÀ VISITABILI
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="Barcelona" />
            <label htmlFor="Barcelona" className="text-sm cursor-pointer flex-1">Barcellona</label>
            <span className="text-xs text-muted-foreground">(10)</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="Ibiza" />
            <label htmlFor="Ibiza" className="text-sm cursor-pointer flex-1">Ibiza</label>
            <span className="text-xs text-muted-foreground">(25)</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="Marseille" />
            <label htmlFor="Marseille" className="text-sm cursor-pointer flex-1">Marsiglia</label>
            <span className="text-xs text-muted-foreground">(5)</span>
          </div>
        </div>
      </div>

      {/* RATINGS */}
      <div>
        <h3 className="font-semibold mb-4">RECENSIONI CLIENTI</h3>
        <div className="space-y-2 text-sm">
          {['5★ (321)', '4★ (222)', '3★ (69)', '2★ (34)', '1★ (15)'].map((rating, i) => (
            <div key={i} className="flex items-center gap-2">
              <Checkbox />
              <label className="cursor-pointer">{rating}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
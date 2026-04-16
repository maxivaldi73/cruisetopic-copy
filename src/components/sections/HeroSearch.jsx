import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronRight } from 'lucide-react';

export default function HeroSearch() {
  const [cruiseType, setCruiseType] = useState('maritime');

  return (
    <div
      className="relative text-white min-h-[420px] flex flex-col justify-end pb-0"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(10,30,80,0.55) 0%, rgba(10,30,80,0.35) 60%, rgba(10,30,80,0.65) 100%), url(https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1600&h=600&fit=crop&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
      }}
    >
      {/* Hero Text */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight drop-shadow-lg">
          <span className="italic">Lorem ipsum</span> dolor sit amet
        </h1>
        <p className="text-white/85 mb-6 text-sm md:text-base max-w-lg leading-relaxed">
          Nam tempus at nulla a ullamcorper. Phasellus tempus id est nec egestas. Duis eu
          purus lectus. Aliquam porta, est eget sagittis dignissim.
        </p>
        <button className="text-sm text-white/80 hover:text-secondary transition-colors flex items-center gap-1">
          Prenota con noi <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-primary/95 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-4">
          {/* Toggle tabs */}
          <div className="flex mb-4 gap-1">
            <button
              onClick={() => setCruiseType('maritime')}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                cruiseType === 'maritime'
                  ? 'bg-secondary text-white shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              marittime
            </button>
            <button
              onClick={() => setCruiseType('river')}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                cruiseType === 'river'
                  ? 'bg-secondary text-white shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              fluviali
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Dove vuoi andare?</label>
              <Select>
                <SelectTrigger className="bg-white text-gray-900 border-0 h-9">
                  <SelectValue placeholder="Destinazione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mediterranean">Mediterraneo</SelectItem>
                  <SelectItem value="caribbean">Caraibi</SelectItem>
                  <SelectItem value="northern">Europa del Nord</SelectItem>
                  <SelectItem value="canary">Isole Canarie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Quando vuoi partire?</label>
              <Input type="date" className="bg-white text-gray-900 border-0 h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Da dove vuoi partire?</label>
              <Select>
                <SelectTrigger className="bg-white text-gray-900 border-0 h-9">
                  <SelectValue placeholder="Porto di partenza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savona">Savona</SelectItem>
                  <SelectItem value="genova">Genova</SelectItem>
                  <SelectItem value="civitavecchia">Civitavecchia</SelectItem>
                  <SelectItem value="venezia">Venezia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Con quale Compagnia?</label>
              <Select>
                <SelectTrigger className="bg-white text-gray-900 border-0 h-9">
                  <SelectValue placeholder="Compagnia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="costa">Costa Crociere</SelectItem>
                  <SelectItem value="msc">MSC Crociere</SelectItem>
                  <SelectItem value="royal">Royal Caribbean</SelectItem>
                  <SelectItem value="ncl">Norwegian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 h-9 flex items-center gap-2">
              <Search className="w-4 h-4" /> Cerca
            </Button>
            <button className="text-white/70 hover:text-white text-sm underline underline-offset-2 transition-colors">
              Ricerca avanzata
            </button>
            <div className="ml-auto text-right hidden md:block">
              <span className="text-2xl font-black text-secondary">1354</span>
              <span className="text-white/70 text-sm ml-1">crociere disponibili</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
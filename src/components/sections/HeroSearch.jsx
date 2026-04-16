import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ship, MapPin, Calendar } from 'lucide-react';

export default function HeroSearch() {
  return (
    <div className="relative bg-primary text-primary-foreground py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Lorem ipsum dolor sit amet
        </h1>
        <p className="text-center text-primary-foreground/80 mb-10 text-lg">
          Nam tempus at nulla a ullamcorper. Phasellus tempus id est nec egestas.
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Cruise Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Ship className="w-4 h-4" /> Tipo di crociera
              </label>
              <Select defaultValue="maritime">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maritime">Marittime</SelectItem>
                  <SelectItem value="river">Fluviali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Quando vuoi partire?
              </label>
              <Input type="date" className="text-gray-900" />
            </div>

            {/* Departure Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Da dove vuoi partire?
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona porto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savona">Savona</SelectItem>
                  <SelectItem value="genova">Genova</SelectItem>
                  <SelectItem value="civitavecchia">Civitavecchia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cruise Line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Ship className="w-4 h-4" /> Con quale Compagnia?
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="costa">Costa</SelectItem>
                  <SelectItem value="msc">MSC</SelectItem>
                  <SelectItem value="royal">Royal Caribbean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Cerca
            </Button>
            <Button variant="outline" className="flex-1">
              Ricerca avanzata
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
          <span className="text-4xl font-bold">1354</span>
          <p className="text-primary-foreground/80">crociere disponibili</p>
        </div>
      </div>
    </div>
  );
}
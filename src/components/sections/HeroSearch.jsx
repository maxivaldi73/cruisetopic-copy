import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ship, MapPin, Calendar } from 'lucide-react';

export default function HeroSearch() {
  return (
    <div 
      className="relative w-full h-96 bg-cover bg-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=400&fit=crop)',
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Lorem ipsum dolor sit amet</h1>
          <p className="text-lg text-gray-200">Nam tempus at nulla a ullamcorper. Phasellus tempus id est nec egestas.</p>
        </div>

        <div className="bg-primary rounded-lg p-8 w-full max-w-4xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Cruise Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tipo di crociera</label>
              <Select defaultValue="maritime">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maritime">Marittime</SelectItem>
                  <SelectItem value="river">Fluviali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Quando vuoi partire?</label>
              <Input type="date" className="bg-white" />
            </div>

            {/* Departure Port */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Da dove vuoi partire?</label>
              <Select>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleziona porto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savona">Savona</SelectItem>
                  <SelectItem value="genoa">Genova</SelectItem>
                  <SelectItem value="civitavecchia">Civitavecchia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cruise Line */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Con quale Compagnia?</label>
              <Select>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleziona compagnia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="costa">Costa</SelectItem>
                  <SelectItem value="msc">MSC</SelectItem>
                  <SelectItem value="royal">Royal Caribbean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-accent hover:bg-accent/90 text-black font-semibold">
              Cerca
            </Button>
            <Button variant="outline" className="flex-1 text-white border-white hover:bg-white/10">
              Ricerca avanzata
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white text-4xl font-bold">1354</p>
          <p className="text-gray-200">crociere disponibili</p>
        </div>
      </div>
    </div>
  );
}
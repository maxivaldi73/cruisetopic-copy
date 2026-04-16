import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SearchBar() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Destinazione</label>
          <Select defaultValue="mediterranean">
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mediterranean">Mediterraneo</SelectItem>
              <SelectItem value="caribbean">Caraibi</SelectItem>
              <SelectItem value="northern">Europa del Nord</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Quando vuoi partire?</label>
          <Input type="date" className="bg-white" />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-white mb-2">Con quale Compagnia?</label>
          <Select>
            <SelectTrigger className="bg-white">
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
        <Button className="flex-1 bg-accent hover:bg-accent/90 text-black font-semibold">
          Cerca
        </Button>
        <Button variant="outline" className="flex-1 text-white border-white hover:bg-white/10">
          Ricerca avanzata
        </Button>
      </div>
    </div>
  );
}
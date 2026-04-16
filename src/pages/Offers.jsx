import React from 'react';
import { Button } from '@/components/ui/button';
import OfferCard from '@/components/OfferCard';
import WhyCruisetopic from '@/components/WhyCruisetopic';

const offers = [
  {
    id: 1,
    title: 'Isole greche con Cruisetopic',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    cruises: 354,
    companies: 124,
    badge: null,
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
  {
    id: 2,
    title: 'Estate nelle isole Baleari',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=500&fit=crop',
    cruises: 219,
    companies: 21,
    badge: { type: 'discount', text: '20%', label: 'sconto' },
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
  {
    id: 3,
    title: 'Le isole Vergini come non le hai mai viste',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop',
    cruises: 154,
    companies: 14,
    badge: { type: 'special', text: 'SPECIAL PROMO' },
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
  {
    id: 4,
    title: 'Una vacanza indimenticabile con Cruisetopic',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=500&fit=crop',
    cruises: 259,
    companies: 94,
    badge: { type: 'limited', text: 'Ancora pochi POSTI' },
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
  {
    id: 5,
    title: 'Mediterraneo da scoprire',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=500&fit=crop',
    cruises: 354,
    companies: 124,
    badge: null,
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
  {
    id: 6,
    title: "Un'estate da sogno con Cruisetopic",
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    cruises: 354,
    companies: 124,
    badge: null,
    description: "Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell'estate 2024 e approfitta delle offerte speciali!",
  },
];

export default function Offers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Intro Section */}
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Offerte</h1>
          <div className="flex gap-4 mb-6">
            <button className="text-primary-foreground border-b-2 border-primary-foreground font-semibold">Marittime</button>
            <button className="text-primary-foreground/70 hover:text-primary-foreground">Fluviali</button>
          </div>
          <p className="max-w-2xl text-primary-foreground/80">
            State cercando l'offerta migliore per le vostre prossime vacanze in crociera? Siete sul sito giusto. 
            Cruisetopic, agenzia di viaggi online specializzata in crociere vi offre una vasta gamma di promozioni 
            verso tutte le migliori destinazioni. Vi aiuteremo a trovare le offerte più economiche per darvi la 
            possibilità di raggiungere le mete che avete sempre sognato.
          </p>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg">
            Carica altre offerte →
          </Button>
        </div>
      </div>

      {/* Why Cruisetopic Section */}
      <WhyCruisetopic />

      {/* CTA Section */}
      <div className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <p className="text-lg mb-4">Un nostro consulente ti aiuterà ad selezionare esattamente ciò di cui hai bisogno. Siamo qui per aiutarti!</p>
        <Button variant="secondary" size="lg">Siamo qui per aiutarti!</Button>
      </div>
    </div>
  );
}
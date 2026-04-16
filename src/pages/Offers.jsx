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
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
  {
    id: 2,
    title: 'Estate nelle isole Baleari',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=500&fit=crop',
    cruises: 219,
    companies: 21,
    badge: { type: 'discount', text: '20%', label: 'sconto' },
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
  {
    id: 3,
    title: 'Le isole Vergini come non le hai mai viste',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop',
    cruises: 154,
    companies: 14,
    badge: { type: 'special', text: 'SPECIAL PROMO' },
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
  {
    id: 4,
    title: 'Una vacanza indimenticabile con Cruisetopic',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=500&fit=crop',
    cruises: 259,
    companies: 94,
    badge: { type: 'limited', text: 'Ancora pochi POSTI' },
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
  {
    id: 5,
    title: 'Mediterraneo da scoprire',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=500&fit=crop',
    cruises: 354,
    companies: 124,
    badge: null,
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
  {
    id: 6,
    title: 'Un\'estate da sogno con Cruisetopic',
    season: 'PRIMAVERA ESTATE 2024',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    cruises: 354,
    companies: 124,
    badge: null,
    description: 'Scegli la tua crociera per le Isole Greche tra le migliori compagnie di crociera come MSC Crociere, Costa Crociere, Royal Caribbean e Norwegian Cruise Line e vivi una vacanza indimenticabile. Prenota in anticipo la tua crociera dell\'estate 2024 e approfitta delle offerte speciali!',
  },
];

export default function Offers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Intro Section */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Offerte</h1>
              <p className="text-sm text-muted-foreground">Marittime</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">Fluviali</Button>
          </div>

          <p className="text-muted-foreground mb-8 max-w-2xl">
            State cercando l'offerta migliore per le vostre prossime vacanze in crociera? Siete sul sito giusto. Cruisetopic, agenzia di viaggi online specializzata in crociere vi offre una vasta gamma di promozioni verso tutte le migliori destinazioni. Vi aiuteremo a trovare le offerte più economiche per darvi la possibilità di raggiungere le mete che avete sempre sognato.
          </p>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          {/* Load More */}
          <div className="flex justify-center mb-12">
            <Button variant="outline" className="gap-2">
              Carica altre offerte
              <span>→</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Cruisetopic Section */}
      <WhyCruisetopic />

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-6">
            Un nostro consulente ti aiuterà ad selezionare esattamente ciò di cui hai bisogno. Siamo qui per aiutarti!
          </p>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            Siamo qui per aiutarti!
          </Button>
        </div>
      </section>
    </div>
  );
}
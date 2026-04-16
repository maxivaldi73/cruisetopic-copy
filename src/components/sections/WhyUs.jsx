import { Shield, CreditCard, Heart, Compass } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Shield,
      title: 'Ti puoi fidare',
      description: 'Oltre 40.000 passeggeri si sono fidati di Cruise Topic e dei suoi agenti di viaggio specializzati',
    },
    {
      icon: CreditCard,
      title: 'Pagamenti flessibili',
      description: "Prenota con un acconto e paga il resto un po' per volta a interessi 0",
    },
    {
      icon: Heart,
      title: 'Stai sicuro',
      description: 'Assicurazione multirischio sempre inclusa nella tua Carta Crociera Felice',
    },
    {
      icon: Compass,
      title: 'Crociera personalizzata',
      description: 'Trova la combinazione perfetta e approfitta di prezzi esclusivi',
    },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">Perchè Cruisetopic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, idx) => {
            const Icon = reason.icon;
            return (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{reason.title}</h3>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
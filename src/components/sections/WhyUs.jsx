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
      description: 'Prenota con un acconto e paga il resto un po\' per volta a interessi 0',
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
    <section className="py-16 bg-accent">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-foreground">Perchè Cruisetopic</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, idx) => {
            const Icon = reason.icon;
            return (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <Icon className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
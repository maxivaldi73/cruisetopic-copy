import { Heart, CreditCard, Shield, Compass } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Heart,
      title: 'Ti puoi fidare',
      description: 'Oltre 40.000 passeggeri si sono fidati di Cruise Topic e dei suoi agenti di viaggio specializzati TOP CRUISER',
    },
    {
      icon: CreditCard,
      title: 'Pagamenti flessibili',
      description: "Prenota con un acconto e paga il resto un po' per volta a interessi 0",
    },
    {
      icon: Shield,
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
    <section className="py-14 px-4" style={{ background: 'linear-gradient(135deg, hsl(221, 90%, 30%) 0%, hsl(221, 90%, 45%) 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Perchè Cruisetopic</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((reason, idx) => {
            const Icon = reason.icon;
            return (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-colors"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{reason.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{reason.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
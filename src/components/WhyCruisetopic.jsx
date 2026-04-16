import React from 'react';
import { Heart, Users, Shield, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhyCruisetopic() {
  const reasons = [
    {
      icon: Heart,
      title: 'Prezzi imbattibili',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Users,
      title: 'Esperti di crociere',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Shield,
      title: 'Sicurezza garantita',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Users2,
      title: 'Assistenza 24/7',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">Perché Cruisetopic</h2>
          <Button variant="link" className="text-primary">Facile e sicuro →</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <div key={i} className="text-center">
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
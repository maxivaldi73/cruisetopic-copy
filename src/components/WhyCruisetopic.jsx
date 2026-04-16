import React from 'react';
import { Heart, Users, Shield, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhyCruisetopic() {
  const reasons = [
    {
      icon: Heart,
      title: 'Prezzi',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Users,
      title: 'Prezzi',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Shield,
      title: 'Prezzi',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
    {
      icon: Users2,
      title: 'Prezzi',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas quis ligula ac leo pellentesque pellentesque.',
    },
  ];

  return (
    <section className="py-16 bg-cyan-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-white">Perché Cruisetopic</h2>
          <Button variant="outline" className="text-cyan-500 border-cyan-500 hover:bg-cyan-500/10">
            Facile e sicuro →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <div key={i} className="bg-cyan-400/20 rounded-lg p-8 text-white text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 rounded-full p-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                <p className="text-sm text-white/90">{reason.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
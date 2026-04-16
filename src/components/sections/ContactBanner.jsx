import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactBanner() {
  return (
    <div className="bg-primary py-5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-white">
          <MessageCircle className="w-5 h-5 text-secondary flex-shrink-0" />
          <p className="text-sm text-white/90">
            Un nostro consulente ti aiuterà ad selezionare esattamente ciò di cui hai bisogno. Siamo qui per aiutarti!
          </p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-white font-semibold whitespace-nowrap flex items-center gap-2 flex-shrink-0">
          <Phone className="w-4 h-4" />
          Siamo qui per aiutarti!
        </Button>
      </div>
    </div>
  );
}
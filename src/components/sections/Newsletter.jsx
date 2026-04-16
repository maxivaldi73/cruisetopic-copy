import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function Newsletter() {
  return (
    <section className="py-8 px-4 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Icon and text */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Resta sempre aggiornato sulle offerte</h3>
              <p className="text-muted-foreground text-sm">Iscriviti alla nostra newsletter</p>
            </div>
          </div>

          {/* Email form */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-64">
              <label className="text-xs text-muted-foreground block mb-1">e-mail</label>
              <Input
                type="email"
                placeholder="email@test.it"
                className="bg-white border-border h-9"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 mt-5">
              Invia
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
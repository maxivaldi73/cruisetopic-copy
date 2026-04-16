import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Newsletter() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-primary/90">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2">Resta sempre aggiornato sulle offerte</h2>
          <p className="text-white/90 mb-6">Iscriviti alla nostra newsletter</p>
          
          <div className="flex gap-2">
            <Input 
              type="email" 
              placeholder="email@test.it"
              className="bg-white text-foreground"
            />
            <Button className="bg-accent hover:bg-accent/90 text-black font-semibold">
              Invia
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
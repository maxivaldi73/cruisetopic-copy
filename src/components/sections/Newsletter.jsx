import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Newsletter() {
  return (
    <section className="py-16 px-4 bg-primary text-primary-foreground">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-2">Resta sempre aggiornato sulle offerte</h2>
        <p className="text-primary-foreground/80 mb-6">Iscriviti alla nostra newsletter</p>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="La tua email"
            className="bg-white text-gray-900 flex-1"
          />
          <Button variant="secondary" className="font-semibold">
            Invia
          </Button>
        </div>
      </div>
    </section>
  );
}
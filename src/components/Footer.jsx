import { Phone, Mail, AlertTriangle, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';

export default function Footer() {
  const footerLinks = [
    {
      title: 'Chi siamo',
      links: ['I nostri partner', 'Jobs HIRING!'],
    },
    {
      title: 'Perchè noi',
      links: ['Assistenza specializzata', 'La tua crociera', 'Assicurazione', 'Orari'],
    },
    {
      title: 'Guida alla crociera',
      links: ['Come scegliere', 'Come prenotare', 'Prima di partire', 'La vita di bordo'],
    },
    {
      title: 'Informazioni utili',
      links: ['Condizioni generali', 'Assicurazione', 'Crociera felice'],
    },
  ];

  return (
    <footer>
      {/* Contact info bar */}
      <div className="bg-primary/10 border-t border-border py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="tel:028001100" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            +39 02 80011100
          </a>
          <a href="tel:0392125552" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            +39 392 1255525
          </a>
          <a href="mailto:info@cruisetopic.net" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Mail className="w-4 h-4" />
            info@cruisetopic.net
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <AlertTriangle className="w-4 h-4" />
            Contatti di emergenza
          </a>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-background border-t border-border py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Recensioni</a>
            <a href="#" className="hover:text-primary transition-colors">Newsletter</a>
            <a href="#" className="hover:text-primary transition-colors">Contatti</a>
          </div>
          <div className="flex gap-3">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="bg-background border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Logo column */}
            <div className="col-span-2 md:col-span-1">
              <div className="font-black text-lg mb-3">
                <span className="text-primary">CRUISE</span>
                <span className="text-secondary">TOPIC</span>
              </div>
            </div>

            {footerLinks.map((col, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-sm text-foreground mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© 2024 CRUISETOPIC — Digitaltrend Italia Srl - P.I. 02599920994 - Licenza Agenzia di viaggio nº0272239</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
import { Link } from 'react-router-dom';
import { Phone, User, ChevronDown, Globe } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <span className="font-black text-xl tracking-tight">
            <span className="text-white">CRUISE</span>
            <span className="text-secondary">TOPIC</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/offers" className="hover:text-secondary transition-colors">Offerte</Link>
          <span className="hover:text-secondary cursor-pointer transition-colors">Destinazioni</span>
          <span className="hover:text-secondary cursor-pointer transition-colors">Compagnie</span>
          <span className="hover:text-secondary cursor-pointer transition-colors">Porti</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-secondary transition-colors">
            <User className="w-4 h-4" />
            <span>Area riservata</span>
          </div>
          <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-secondary transition-colors">
            <Globe className="w-4 h-4" />
            <span>Italia</span>
            <ChevronDown className="w-3 h-3" />
          </div>
          <a href="tel:028001100" className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 transition-colors px-3 py-1.5 rounded font-semibold text-white">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">02 80011100</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
import { Link } from 'react-router-dom';
import { CalendarCheck, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';
import Logo from '../../components/common/Logo.jsx';

const features = [
  { icon: CalendarCheck, label: 'Easy Booking' },
  { icon: Sparkles, label: 'Premium Services' },
  { icon: HeartHandshake, label: 'Personal Care' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/login page image.png"
          alt="Amra Beauty"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-12">
          <Link to="/"><Logo /></Link>

          <div className="rounded-3xl border border-white/10 bg-ink/40 p-7 backdrop-blur-sm">
            <p className="font-serif text-3xl text-cream">
              Your Beauty, <span className="gold-text italic">Our Passion</span>
            </p>
            <div className="mt-3 h-px w-24 bg-gradient-to-r from-gold to-transparent" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
              Continue your beauty journey and manage your appointments with ease.
            </p>
            <div className="mt-6 flex gap-8">
              {features.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <f.icon size={18} />
                  </span>
                  <span className="text-xs text-cream/70">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/"><Logo /></Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/70 p-8 shadow-soft backdrop-blur">
            {/* gold top hairline + glow */}
            <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />

            <div className="relative text-center">
              <h1 className="font-serif text-4xl font-semibold text-cream">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            </div>

            <div className="relative mt-8">{children}</div>

            {footer && <div className="relative mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} className="text-gold" /> Your data is secure and protected
          </div>
          <Link to="/" className="mt-3 block text-center text-sm text-gold hover:underline">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

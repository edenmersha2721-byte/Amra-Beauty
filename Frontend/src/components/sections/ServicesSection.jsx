import { useEffect, useMemo, useState } from 'react';
import {
  LayoutGrid, Scissors, Flower2, Hand, Sparkles, Brush, Droplets, Leaf,
} from 'lucide-react';
import SectionHeading from '../common/SectionHeading.jsx';
import ServiceCard from '../common/ServiceCard.jsx';
import Reveal from '../common/Reveal.jsx';
import Loader from '../common/Loader.jsx';
import { serviceApi, categoryApi, subcategoryApi } from '../../api/endpoints.js';

const CAT_ICON = {
  all: LayoutGrid,
  hair: Scissors,
  spa: Flower2,
  massage: Hand,
  facial: Sparkles,
  nails: Brush,
  makeup: Brush,
  'skin-care': Leaf,
};

export default function ServicesSection() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [active, setActive] = useState('all');
  const [activeSub, setActiveSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      serviceApi.list({ active: 'true' }),
      categoryApi.list({ active: 'true' }),
      subcategoryApi.list({ active: 'true' }),
    ])
      .then(([svc, cat, sub]) => {
        setServices(svc.data.data);
        setCategories(cat.data.data.filter((c) => Number(c.service_count) > 0));
        setSubcategories(sub.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs = [{ slug: 'all', name: 'All Services' }, ...categories];

  // Subcategories belonging to the currently selected category
  const activeCatObj = categories.find((c) => c.slug === active);
  const subs = activeCatObj
    ? subcategories.filter((sc) => sc.category_id === activeCatObj.id)
    : [];

  const selectCategory = (slug) => {
    setActive(slug);
    setActiveSub(null);
  };

  const filtered = useMemo(() => {
    let list = active === 'all' ? services : services.filter((s) => s.category_slug === active);
    if (active !== 'all' && activeSub) {
      list = list.filter((s) => s.subcategory_slug === activeSub);
    }
    return list.slice(0, 6);
  }, [services, active, activeSub]);

  return (
    <section id="services" className="relative flex min-h-screen items-center overflow-hidden bg-ink py-24">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      <div className="container-lux relative w-full">
        <SectionHeading
          eyebrow="Our Premium Services"
          title="Explore Our Services"
          subtitle="A curated range of premium beauty and wellness services, designed just for you."
        />

        {/* Category selector — icon tiles */}
        <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
          {tabs.map((c) => {
            const Icon = CAT_ICON[c.slug] || Sparkles;
            const isActive = active === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => selectCategory(c.slug)}
                className={`group flex w-24 flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all duration-300 ${
                  isActive
                    ? 'border-gold/70 bg-gold/10 shadow-gold'
                    : 'border-line bg-panel hover:border-gold/40 hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isActive ? 'text-gold' : 'text-cream/60 group-hover:text-gold'
                  }`}
                >
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <span className={`text-xs font-medium ${isActive ? 'text-gold' : 'text-cream/70'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </Reveal>

        {/* Subcategory selector — appears when the chosen category has subcategories */}
        {subs.length > 0 && (
          <Reveal className="mt-12 text-center">
            <p className="eyebrow">{activeCatObj.name} Services</p>
            <h3 className="mt-2 font-serif text-3xl font-semibold text-cream md:text-4xl">
              Choose Your <span className="gold-text">{activeCatObj.name}</span> Style
            </h3>
            <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => setActiveSub(null)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                  !activeSub ? 'border-gold/70 bg-gold/15 text-gold' : 'border-line text-cream/70 hover:border-gold/40'
                }`}
              >
                All
              </button>
              {subs.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveSub(sc.slug)}
                  className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                    activeSub === sc.slug ? 'border-gold/70 bg-gold/15 text-gold' : 'border-line text-cream/70 hover:border-gold/40'
                  }`}
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {loading ? (
          <Loader label="Loading services…" />
        ) : filtered.length ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-muted">No services in this selection yet.</p>
        )}
      </div>
    </section>
  );
}

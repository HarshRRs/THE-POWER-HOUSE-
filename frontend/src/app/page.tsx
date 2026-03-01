"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import LiveTicker from "@/components/LiveTicker";

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
interface Stats {
  appointmentsDetected: number;
  prefecturesMonitored: number;
  activeUsers: number;
  detectionsLast24h: number;
  uptime: string;
}

interface Prefecture {
  id: string;
  name: string;
  department: string;
  region: string;
  status: string;
  lastSlotFoundAt: string | null;
  url: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  maxAlerts: number | string;
  channels: string[];
  checkInterval: number;
  type: string;
}

/* ═══════════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════════ */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(end / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { start = end; clearInterval(timer); }
            setCount(start);
          }, 25);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ═══════════════════════════════════════════════
   Time ago helper
   ═══════════════════════════════════════════════ */
function timeAgo(date: string | null): string {
  if (!date) return "Jamais";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

/* ═══════════════════════════════════════════════
   Header
   ═══════════════════════════════════════════════ */
function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header className={`bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-md border-gray-200" : "border-transparent"}`}>
      <div className="tricolor-bar w-full" />
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span><span className="text-gray-400 text-sm">.fr</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#urgence" className="hover:text-accent transition-colors">Situation</a>
          <a href="#fonctionnement" className="hover:text-primary transition-colors">Comment ça marche</a>
          <a href="#tarifs" className="hover:text-primary transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline hidden sm:inline">Connexion</Link>
          <Link href="/register" className="gradient-urgent text-white text-sm font-bold px-4 py-2.5 sm:px-5 rounded-xl hover:opacity-90 shadow-lg shadow-accent/20 flex items-center gap-1.5 btn-press">
            🚨 <span className="hidden sm:inline">Agir maintenant</span><span className="sm:hidden">Agir</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════
   Hero — stats from API
   ═══════════════════════════════════════════════ */
function Hero({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const detected = stats?.detectionsLast24h ?? 0;

  return (
    <section className="gradient-hero text-white relative overflow-hidden">
      {/* LIVE Emergency Banner — uses real data */}
      <LiveTicker />
      <div className="bg-accent text-white text-center py-3 text-sm font-bold relative z-20">
        <span className="animate-urgent-blink inline-block mr-2">🔴</span>
        {detected > 0
          ? `EN DIRECT — ${detected} RDV préfecture détectés dans les dernières 24h — Prenez le vôtre MAINTENANT`
          : "SURVEILLANCE ACTIVE 24h/24 — Des créneaux préfecture peuvent apparaître à tout moment"}
        <span className="animate-urgent-blink inline-block ml-2">🔴</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8 text-sm">
          <span className="w-2 h-2 bg-accent rounded-full animate-urgent-blink"></span>
          Surveillance 24h/24 — Alerte en moins de 30 secondes
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight mb-6 max-w-4xl mx-auto">
          Prenez votre <span className="text-accent">RDV préfecture</span> en 24h<br />
          <span className="text-xl sm:text-2xl md:text-3xl font-medium">Alertes instantanées dès qu'un créneau se libère</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Vous cherchez désespérément un <span className="text-white font-bold">RDV préfecture</span> depuis des semaines ?
          <br className="hidden sm:block" />Notre système surveille <span className="text-accent font-bold">la préfecture de Paris</span> toutes les 30 secondes et vous alerte instantanément dès qu'un créneau est disponible.
        </p>


      </div>

      <div className="absolute top-20 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-info/20 rounded-full blur-[100px]"></div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Prefecture Picker (New)
   ═══════════════════════════════════════════════ */
function PrefecturePicker({ prefectures }: { prefectures: Prefecture[] }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const filtered = prefectures.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.department.includes(search)
  ).slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-12 bg-white relative z-20 -mt-20 mx-4"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 md:p-10 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Commencez par choisir votre préfecture</h3>
        <p className="text-gray-500 mb-6">Nous vérifierons les disponibilités spécifiquement pour vous.</p>

        <div className="relative max-w-lg mx-auto text-left">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher (ex: Paris, 75, Lyon...)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-lg"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {isOpen && (search.length > 0 || filtered.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/register?prefectureId=${p.id}&name=${encodeURIComponent(p.name)}`)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0 group"
                  >
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{p.name}</span>
                      <span className="text-gray-400 ml-2">({p.department})</span>
                    </div>
                    <span className="text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                      Surveiller →
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-5 text-gray-400 text-center">Aucune préfecture trouvée</div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm">
          {['Paris', 'Bobigny', 'Nanterre', 'Créteil', 'Versailles'].map(city => {
            const p = prefectures.find(pref => pref.name === city);
            if (!p) return null;
            return (
              <button
                key={city}
                onClick={() => router.push(`/register?prefectureId=${p.id}&name=${encodeURIComponent(p.name)}`)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                {city}
              </button>
            )
          })}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   Live Situation — prefectures from API
   ═══════════════════════════════════════════════ */
function LiveSituation({ prefectures, loading }: { prefectures: Prefecture[]; loading: boolean }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "active", color: "bg-success text-white" },
    SATURATED: { label: "critique", color: "bg-accent text-white" },
    UNAVAILABLE: { label: "indisponible", color: "bg-gray-500 text-white" },
    MAINTENANCE: { label: "maintenance", color: "bg-warning text-white" },
  };

  // Show the top 6 most critical prefectures
  const featured = [...prefectures]
    .sort((a, b) => {
      if (a.status === "SATURATED" && b.status !== "SATURATED") return -1;
      if (b.status === "SATURATED" && a.status !== "SATURATED") return 1;
      const aTime = a.lastSlotFoundAt ? new Date(a.lastSlotFoundAt).getTime() : 0;
      const bTime = b.lastSlotFoundAt ? new Date(b.lastSlotFoundAt).getTime() : 0;
      return aTime - bTime;
    })
    .slice(0, 6);

  const [now, setNow] = useState<number | null>(() => typeof window !== 'undefined' ? Date.now() : null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section
      id="urgence"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-16 bg-accent-light border-y border-accent/20"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="emergency-badge px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-urgent-blink"></span>
            SITUATION EN DIRECT
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Les créneaux sont <span className="text-accent">quasi-inexistants</span></h2>
          <p className="text-gray-600 mt-3">Sans surveillance automatique, vous n&apos;avez <strong>aucune chance</strong></p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 card-govt">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="h-5 w-24 skeleton rounded mb-1" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                  <div className="h-5 w-16 skeleton rounded-full" />
                </div>
                <div className="h-4 w-full skeleton rounded" />
              </div>
            ))
          ) : (
            featured.map((p) => {
              const status = statusConfig[p.status] || statusConfig.ACTIVE;
              const isCritical = p.status === "SATURATED" || p.status === "UNAVAILABLE";
              return (
                <Link
                  key={p.id}
                  href={`/register?prefectureId=${p.id}&name=${encodeURIComponent(p.name)}`}
                  className={`block bg-white rounded-xl p-5 ${isCritical ? "card-urgent" : "card-govt"} hover:shadow-lg transition-all group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{p.name}</h3>
                      <span className="text-xs text-gray-400">Département {p.department}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Dernier créneau: <strong className="text-gray-900">{timeAgo(p.lastSlotFoundAt)}</strong></span>
                    <span className="text-xs text-accent font-bold">
                      {/* Use 'now' state to avoid hydration errors */}
                      {!p.lastSlotFoundAt || (now && (now - new Date(p.lastSlotFoundAt).getTime() > 86400000)) ? "❌ Aucun créneau" : "✅ Récent"}
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-xs font-bold text-primary bg-primary-light/50 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                      ⚡ Surveiller maintenant
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          {!loading && <span>Données en temps réel — {prefectures.length} préfectures surveillées</span>}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   How It Works
   ═══════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { icon: "💳", title: "1. Choisissez votre plan", desc: "À partir de 4,99€. Paiement sécurisé en 30 secondes." },
    { icon: "🏛️", title: "2. Sélectionnez votre procédure", desc: "Préfecture de Paris couverte. Choisissez la procédure souhaitée." },
    { icon: "🚨", title: "3. Recevez votre alerte", desc: "Dès qu'un créneau apparaît, notification instantanée. Réservez avant les autres." },
  ];

  return (
    <motion.section
      id="fonctionnement"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-white"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">3 étapes. 30 secondes. C&apos;est tout.</h2>
          <p className="text-gray-500 mt-3">Pendant que vous dormez, on surveille pour vous</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card-govt bg-white rounded-xl p-7 hover:shadow-lg transition-all">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   Pricing — from API /api/billing/plans
   ═══════════════════════════════════════════════ */
function Pricing({ plans, loading }: { plans: Plan[]; loading: boolean }) {
  const planMeta: Record<string, { badge?: string; returnPolicy: { text: string; color: string; bgColor: string }; style: string; btnStyle: string; cta: string; desc: string; features: string[] }> = {
    URGENCE_24H: {
      style: "border-gray-300 bg-white",
      btnStyle: "bg-gray-900 text-white hover:bg-gray-800",
      cta: "⚡ Activer pour 24h",
      desc: "Pour les chanceux qui veulent tenter aujourd'hui",
      returnPolicy: { text: "❌ Pas de remboursement", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
      features: ["1 alerte active", "1 préfecture", "Notification email", "Vérification toutes les 2 min", "Valable 24 heures"],
    },
    URGENCE_7J: {
      badge: "MEILLEUR RAPPORT",
      style: "border-accent bg-white ring-2 ring-accent/20 scale-105",
      btnStyle: "gradient-urgent text-white shadow-xl shadow-accent/25",
      cta: "🚨 Activer 7 jours",
      desc: "Le plus choisi — 7 jours de surveillance non-stop",
      returnPolicy: { text: "🟡 50% remboursé si échec", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
      features: ["3 alertes actives", "Toutes les préfectures", "Email + Telegram", "Vérification toutes les 60s", "7 jours de couverture", "Support prioritaire"],
    },
    URGENCE_TOTALE: {
      style: "border-primary bg-primary-light/30",
      btnStyle: "gradient-primary text-white shadow-lg shadow-primary/20",
      cta: "🔥 Surveillance totale",
      desc: "Jusqu'à ce que vous obteniez votre RDV",
      returnPolicy: { text: "✅ RDV ou remboursé", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
      features: ["Alertes illimitées", "Toutes les préfectures", "Email + Telegram + SMS", "Vérification toutes les 30s", "Surveillance continue", "Conciergerie RDV", "Garantie remboursement automatique"],
    },
  };

  // Fallback display names
  const displayNames: Record<string, string> = {
    URGENCE_24H: "Urgence 24h",
    URGENCE_7J: "Urgence 7 jours",
    URGENCE_TOTALE: "Urgence Totale",
  };

  return (
    <motion.section
      id="tarifs"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-gray-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="emergency-badge px-4 py-1.5 rounded-full text-xs font-bold">TARIFS D&apos;URGENCE</span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Combien vaut votre temps ?</h2>
          <p className="text-gray-600 mt-3">3 semaines à rafraîchir une page, ou <strong className="text-accent">4,99€ pour qu&apos;on le fasse pour vous</strong></p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-200 p-7 bg-white">
                <div className="h-6 w-32 skeleton rounded mb-2" />
                <div className="h-4 w-48 skeleton rounded mb-4" />
                <div className="h-10 w-24 skeleton rounded mb-6" />
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 w-full skeleton rounded mb-3" />
                ))}
                <div className="h-12 w-full skeleton rounded-xl mt-4" />
              </div>
            ))
          ) : plans.length > 0 ? (
            plans.map((plan) => {
              const meta = planMeta[plan.id] || planMeta.URGENCE_24H;
              const name = displayNames[plan.id] || plan.name;
              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 p-7 ${meta.style} transition-all hover:shadow-xl`}>
                  {meta.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 emergency-badge px-4 py-1 rounded-full text-xs font-bold tracking-wide whitespace-nowrap">
                      {meta.badge}
                    </div>
                  )}
                  {/* Return Policy Badge */}
                  <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full border ${meta.returnPolicy.bgColor} ${meta.returnPolicy.color}`}>
                    {meta.returnPolicy.text}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{meta.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-gray-900">{plan.price.toFixed(2).replace('.', ',')}€</span>
                    <span className="text-gray-400 text-sm ml-1">{plan.type === "subscription" ? "/mois" : "paiement unique"}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {meta.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-success">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block text-center w-full py-3.5 rounded-xl font-bold text-sm transition-all btn-press ${meta.btnStyle}`}>
                    {meta.cta}
                  </Link>
                </div>
              );
            })
          ) : (
            /* Static fallback if API unavailable */
            [
              { name: "Urgence 24h", price: "4,99€", period: "paiement unique", id: "URGENCE_24H" },
              { name: "Urgence 7 jours", price: "14,99€", period: "paiement unique", id: "URGENCE_7J" },
              { name: "Urgence Totale", price: "29,99€", period: "/mois", id: "URGENCE_TOTALE" },
            ].map((plan) => {
              const meta = planMeta[plan.id];
              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 p-7 ${meta.style} transition-all hover:shadow-xl`}>
                  {meta.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 emergency-badge px-4 py-1 rounded-full text-xs font-bold tracking-wide whitespace-nowrap">
                      {meta.badge}
                    </div>
                  )}
                  {/* Return Policy Badge */}
                  <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full border ${meta.returnPolicy.bgColor} ${meta.returnPolicy.color}`}>
                    {meta.returnPolicy.text}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{meta.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {meta.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-success">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block text-center w-full py-3.5 rounded-xl font-bold text-sm transition-all btn-press ${meta.btnStyle}`}>
                    {meta.cta}
                  </Link>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              ℹ️ Conditions importantes
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Urgence 24h :</strong> Service vendu tel quel, pas de remboursement</li>
              <li>• <strong>Urgence 7 jours :</strong> 50% remboursé si aucun créneau détecté</li>
              <li>• <strong>Urgence Totale :</strong> 100% remboursé si aucun RDV trouvé (garantie automatique)</li>
              <li>• Garanties non applicables en cas de mauvaise configuration ou site indisponible</li>
            </ul>
          </div>
          <p className="text-center text-xs text-gray-400">
            💰 Consultez nos <Link href="/cgv" className="text-primary underline font-medium">Conditions Générales de Vente</Link> pour le détail des politiques de remboursement
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   Comparison
   ═══════════════════════════════════════════════ */
function Comparison() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-16 bg-gray-50"
    >
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-10">Sans RDVPriority vs Avec</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="card-urgent bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold text-accent mb-4">❌ Sans RDVPriority</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-accent">✗</span> Rafraîchir manuellement 50x/jour</li>
              <li className="flex items-center gap-2"><span className="text-accent">✗</span> Attendre 3 à 6 mois</li>
              <li className="flex items-center gap-2"><span className="text-accent">✗</span> Rater les créneaux la nuit</li>
              <li className="flex items-center gap-2"><span className="text-accent">✗</span> Stress et anxiété constants</li>
              <li className="flex items-center gap-2"><span className="text-accent">✗</span> Risque de perdre son titre</li>
            </ul>
          </div>
          <div className="card-govt bg-white rounded-xl p-6 ring-2 ring-success/20">
            <h3 className="text-lg font-bold text-success mb-4">✅ Avec RDVPriority</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-success">✓</span> Surveillance automatique 24h/24</li>
              <li className="flex items-center gap-2"><span className="text-success">✓</span> RDV obtenu en <strong>2 à 7 jours</strong></li>
              <li className="flex items-center gap-2"><span className="text-success">✓</span> Alerte instantanée même à 3h du matin</li>
              <li className="flex items-center gap-2"><span className="text-success">✓</span> Tranquillité d&apos;esprit totale</li>
              <li className="flex items-center gap-2"><span className="text-success">✓</span> À partir de <strong>4,99€</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════ */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Est-ce légal ?", a: "Oui. RDVPriority est un service de détection de changements sur des pages web publiques. Nous vérifions les pages accessibles à tous et vous alertons lorsqu'un changement est détecté — exactement comme si vous rafraîchiez la page vous-même, mais de manière automatisée. Ce type de service (monitoring de pages web) est utilisé par des millions de personnes dans le monde via des outils comme Distill.io ou Visualping." },
    { q: "Comment les alertes fonctionnent ?", a: "Notre système vérifie le site de votre préfecture toutes les 30 à 120 secondes selon votre plan. Dès qu'un changement est détecté (nouveau créneau disponible), vous recevez une notification Email, Telegram ou SMS avec le lien direct pour réserver." },
    { q: "Que se passe-t-il si aucun créneau n'est trouvé ?", a: "Nous offrons une garantie satisfait ou remboursé. Si aucun créneau n'est détecté pendant la durée de votre plan, vous êtes remboursé intégralement. Cependant, nos statistiques montrent que 87% des utilisateurs obtiennent un créneau dans les 7 jours." },
    { q: "Combien de temps faut-il pour obtenir un RDV ?", a: "En moyenne, nos utilisateurs obtiennent un créneau en 2 à 7 jours avec le plan 7 jours, contre 3 à 6 mois en cherchant manuellement. Les créneaux se libèrent souvent la nuit ou tôt le matin — des moments où vous ne serez pas devant votre écran." },
    { q: "Puis-je choisir ma préfecture ?", a: "Nous surveillons la préfecture de Paris. Lors de l'inscription, vous choisissez la procédure souhaitée (titre de séjour, naturalisation, visa, etc.)." },
    { q: "Je peux annuler ?", a: "Les plans 24h et 7 jours sont des paiements uniques, sans engagement. Le plan mensuel peut être annulé à tout moment. Aucune question posée." },
  ];

  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-white"
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">Questions fréquentes</h2>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left p-5 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {item.q}
                <span className={`text-gray-400 text-xl transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed animate-fade-in border-t border-gray-100 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   Blog Preview Section
   ═══════════════════════════════════════════════ */
function BlogPreview() {
  const blogPosts = [
    {
      title: "Comment prendre RDV préfecture en 2024",
      excerpt: "Le guide ultime pour réussir votre prise de RDV préfecture avec les méthodes efficaces et astuces pour éviter les files d'attente.",
      slug: "comment-prendre-rdv-prefecture",
      category: "Guides"
    },
    {
      title: "Préfecture de Paris : Horaires et services essentiels",
      excerpt: "Tout savoir sur la préfecture de Paris : horaires d'ouverture, services disponibles, et conseils pour optimiser votre visite.",
      slug: "prefecture-paris-horaires-services",
      category: "Guides"
    },
    {
      title: "Titre de séjour : Démarches complètes à la préfecture",
      excerpt: "Guide étape par étape pour votre demande de titre de séjour. Documents requis, formulaires, délais, et erreurs à éviter.",
      slug: "titre-sejour-demarches-prefecture",
      category: "Guides"
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-20 bg-gray-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Nos derniers articles</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Guides, actualités et conseils pour réussir vos démarches préfecture</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {blogPosts.map((post, index) => (
            <Link
              key={index}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3">
                {post.category}
              </span>
              <h3 className="font-bold text-gray-900 mb-3 hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <span className="text-primary font-medium text-sm flex items-center gap-1">
                Lire l'article →
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voir tous les articles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="gradient-hero text-white py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="emergency-badge inline-block px-5 py-2.5 rounded-full text-sm font-bold mb-6">
          🔴 DES CRÉNEAUX S&apos;OUVRENT EN CE MOMENT
        </div>
        <h2 className="text-3xl md:text-5xl font-black mb-4">
          4,99€ ou 6 mois d&apos;attente.
          <br />
          <span className="text-accent">À vous de choisir.</span>
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
          Chaque seconde sans surveillance, c&apos;est un créneau pris par quelqu&apos;un d&apos;autre.
        </p>
        <Link href="/register" className="gradient-urgent text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-black text-base sm:text-lg shadow-xl shadow-accent/30 hover:scale-105 transition-transform inline-flex items-center gap-2 urgent-glow btn-press">
          🚨 Activer la surveillance — à partir de 4,99€
        </Link>
        <p className="text-white/30 text-sm mt-4">Paiement sécurisé • Résultat garanti ou remboursé</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="tricolor-bar w-full" />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <span className="text-lg font-extrabold">RDV<span className="text-accent">Priority</span>.fr</span>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Service de détection de changements sur les pages publiques de rendez-vous en préfecture.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-gray-300">Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#fonctionnement" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-gray-300">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/cgv" className="hover:text-white transition-colors">Conditions générales de vente</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-gray-300">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>support@rdvpriority.fr</li>
              <li>Telegram: @rdvpriority</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © 2026 RDVPriority.fr — Service indépendant de détection de changements sur pages web publiques. Non affilié au gouvernement français.
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════
   Main Landing Page — fetches real data
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, prefsRes, plansRes] = await Promise.allSettled([
        api.get("/health/stats"),
        api.get("/prefectures"),
        api.get("/billing/plans"),
      ]);

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data.data);
      }
      if (prefsRes.status === "fulfilled") {
        setPrefectures(prefsRes.value.data.data || []);
      }
      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.data.data || []);
      }
    } catch {
      // Silently fail — components will show fallback/empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh stats every 2 minutes
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <main>
      <Header />
      <Hero stats={stats} loading={loading} />
      <PrefecturePicker prefectures={prefectures} />
      <LiveSituation prefectures={prefectures} loading={loading} />
      <HowItWorks />
      <Comparison />
      <Pricing plans={plans} loading={loading} />
      <FAQ />
      <BlogPreview />
      <FinalCTA />
      <Footer />
    </main>
  );
}

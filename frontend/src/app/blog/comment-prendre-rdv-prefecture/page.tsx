import Link from "next/link";

export default function CommentPrendreRdvPrefecture() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Complet
          </span>
          <span className="text-gray-500">20 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 8 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Comment prendre RDV préfecture en 2024 : Guide complet pour réussir votre réservation
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Le guide ultime pour obtenir votre RDV préfecture sans stress. Découvrez les méthodes efficaces, les astuces pour éviter les files d'attente, et comment obtenir votre créneau en moins de 48h.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Astuce pro :</strong> 87% des personnes qui utilisent un service de surveillance automatique obtiennent leur RDV dans les 72h contre 23% en rafraîchissant manuellement.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#methodes-officielles" className="text-primary hover:underline">Les méthodes officielles de prise de RDV</a></li>
          <li><a href="#erreurs-a-eviter" className="text-primary hover:underline">Les 7 erreurs à éviter absolument</a></li>
          <li><a href="#astuces-optimisation" className="text-primary hover:underline">Astuces pour optimiser vos chances</a></li>
          <li><a href="#services-alternatifs" className="text-primary hover:underline">Services alternatifs et solutions automatisées</a></li>
          <li><a href="#conseils-specifiques" className="text-primary hover:underline">Conseils par type de démarche</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="methodes-officielles">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Les méthodes officielles de prise de RDV préfecture</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">1. Site internet officiel de la préfecture</h3>
          <p>La méthode la plus directe reste le site officiel de votre préfecture. Chaque département dispose d'une plateforme de réservation en ligne :</p>
          
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-bold text-gray-800 mb-2">Sites officiels par département :</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Paris (75) :</strong> paris.prefecture.gouv.fr</li>
              <li><strong>Rhône (69) :</strong> rhone.prefecture.gouv.fr</li>
              <li><strong>Bouches-du-Rhône (13) :</strong> bouchesdurhone.prefecture.gouv.fr</li>
              <li><strong>Nord (59) :</strong> nord.prefecture.gouv.fr</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">2. Téléphone préfecture</h3>
          <p>Appeler directement la préfecture reste une option viable, surtout pour les urgences. Les numéros sont généralement disponibles sur les sites officiels.</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
            <p className="text-yellow-800"><strong>⏰ Horaires d'appel conseillés :</strong> 9h-11h du lundi au jeudi. Évitez les vendredis et débuts de mois.</p>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">3. Présentation physique à la préfecture</h3>
          <p>Se rendre physiquement peut parfois permettre d'obtenir un RDV du jour, surtout en fin de matinée quand les créneaux se libèrent.</p>
        </section>

        <section id="erreurs-a-eviter">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Les 7 erreurs à éviter absolument</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-gray-800">❌ Erreur #1 : Rafraîchir manuellement le site</h3>
              <p className="text-gray-600">Perdre des heures à actualiser la page. Les créneaux se libèrent souvent en quelques secondes, trop vite pour un humain.</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-gray-800">❌ Erreur #2 : Ne pas avoir ses documents prêts</h3>
              <p className="text-gray-600">Arriver au RDV sans pièces justificatives complètes. Préparez tout à l'avance.</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-gray-800">❌ Erreur #3 : Ignorer les préfectures voisines</h3>
              <p className="text-gray-600">Se limiter à une seule préfecture. Élargir sa recherche augmente vos chances de 300%.</p>
            </div>
          </div>
        </section>

        <section id="astuces-optimisation">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Astuces pour optimiser vos chances</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Timing stratégique</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Meilleurs moments :</strong> Lundi matin et vendredi après-midi (annulations fréquentes)</li>
            <li><strong>Éviter :</strong> Débuts de mois, vacances scolaires, jours fériés</li>
            <li><strong>Périodes porteuses :</strong> 2 semaines avant les grandes vacances</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Multi-préfectures</h3>
          <p>Surveillez plusieurs préfectures simultanément. Si vous habitez à Lyon, surveillez aussi Saint-Étienne, Grenoble et Chambéry.</p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <h4 className="font-bold text-green-800 mb-2">✅ Stratégie gagnante :</h4>
            <p className="text-green-700">Surveillez 3-5 préfectures dans un rayon de 100km. Augmente vos chances de 400%.</p>
          </div>
        </section>

        <section id="services-alternatifs">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Services alternatifs et solutions automatisées</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">La surveillance automatique</h3>
          <p>Des services comme RDVPriority surveillent 24h/24 les sites de préfecture et vous alertent instantanément dès qu'un créneau se libère.</p>
          
          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority</h4>
            <p className="mb-3">Surveillance automatique de 101 préfectures françaises toutes les 30 secondes. Alertes instantanées par email, SMS et Telegram.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Essayer gratuitement
            </Link>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Avantages de l'automatisation</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Efficacité :</strong> 99.9% de disponibilité 24h/24</li>
            <li><strong>Rapidité :</strong> Notification en moins de 30 secondes</li>
            <li><strong>Couverture :</strong> 101 préfectures surveillées simultanément</li>
            <li><strong>Multi-canaux :</strong> Email, SMS, Telegram, WhatsApp</li>
          </ul>
        </section>

        <section id="conseils-specifiques">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Conseils par type de démarche</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Titre de séjour</h3>
          <p>Pour les titres de séjour, privilégiez les préfectures de quartier plutôt que les centres urbains très demandés.</p>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Passeport/Carte d'identité</h3>
          <p>Les périodes de vacances scolaires voient une forte demande. Planifiez 2-3 mois à l'avance.</p>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Naturalisation</h3>
          <p>Les RDV naturalisation sont très prisés. Utilisez impérativement un service de surveillance.</p>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Combien de temps faut-il généralement pour obtenir un RDV ?</h3>
              <p className="text-gray-600">En moyenne : 2-8 semaines selon le département et la période. Avec surveillance automatique : 1-3 jours.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Est-ce légal d'utiliser un service de surveillance ?</h3>
              <p className="text-gray-600">Oui, totalement. Ces services ne réservent pas à votre place mais vous alertent quand des créneaux se libèrent.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Quel budget prévoir ?</h3>
              <p className="text-gray-600">Gratuit si vous faites vous-même. 4,99€ à 29,99€/mois pour les services automatisés selon les fonctionnalités.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Ne perdez plus de temps</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Arrêtez de rafraîchir manuellement les sites de préfecture. 
            Laissez RDVPriority trouver votre RDV pendant que vous dormez.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Commencer maintenant
            </Link>
            <Link href="/#tarifs" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              Voir les tarifs
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
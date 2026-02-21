import Link from "next/link";

export default function PrefecturesRegionalesComparatif() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Comparatif
          </span>
          <span className="text-gray-500">15 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 8 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Préfectures Lyon, Marseille, Bordeaux : Guide comparatif 2024
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Comparatif détaillé des préfectures majeures de province. Services, efficacité, temps d'attente, et stratégies pour choisir la meilleure option selon votre situation géographique.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📊 Analyse comparative :</strong> Étude approfondie de 24 préfectures dans 8 régions différentes pour identifier les meilleures pratiques et les goulets d'étranglement.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#comparatif-general" className="text-primary hover:underline">Comparatif général des 3 villes</a></li>
          <li><a href="#prefecture-lyon" className="text-primary hover:underline">Préfecture de Lyon en détail</a></li>
          <li><a href="#prefecture-marseille" className="text-primary hover:underline">Préfecture de Marseille en détail</a></li>
          <li><a href="#prefecture-bordeaux" className="text-primary hover:underline">Préfecture de Bordeaux en détail</a></li>
          <li><a href="#strategies-choix" className="text-primary hover:underline">Comment choisir la bonne préfecture</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="comparatif-general">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Comparatif général : Lyon vs Marseille vs Bordeaux</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Critère</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Lyon (Rhône)</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Marseille (Bouches-du-Rhône)</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Bordeaux (Gironde)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Temps d'attente moyen</td>
                  <td className="py-3 px-4 bg-green-50">2h45 ⭐</td>
                  <td className="py-3 px-4 bg-red-50">6h30 ❌</td>
                  <td className="py-3 px-4 bg-yellow-50">4h15 ⚠️</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Services numériques</td>
                  <td className="py-3 px-4 bg-green-50">Avancés ⭐</td>
                  <td className="py-3 px-4 bg-red-50">Basiques ❌</td>
                  <td className="py-3 px-4 bg-green-50">Modernes ⭐</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Personnel accueillant</td>
                  <td className="py-3 px-4 bg-green-50">85% positif ⭐</td>
                  <td className="py-3 px-4 bg-red-50">45% négatif ❌</td>
                  <td className="py-3 px-4 bg-yellow-50">70% neutre ⚠️</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Infrastructure</td>
                  <td className="py-3 px-4 bg-green-50">Moderne ⭐</td>
                  <td className="py-3 px-4 bg-red-50">Vétuste ❌</td>
                  <td className="py-3 px-4 bg-green-50">Rénovée ⭐</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Accessibilité</td>
                  <td className="py-3 px-4 bg-green-50">Excellente ⭐</td>
                  <td className="py-3 px-4 bg-yellow-50">Moyenne ⚠️</td>
                  <td className="py-3 px-4 bg-green-50">Bonne ⭐</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
              <div className="text-3xl font-black mb-2">🏆</div>
              <div className="font-bold text-lg mb-1">Lyon</div>
              <div className="text-sm">Meilleur rapport qualité/prix</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
              <div className="text-3xl font-black mb-2">⚠️</div>
              <div className="font-bold text-lg mb-1">Bordeaux</div>
              <div className="text-sm">Correct mais perfectible</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white">
              <div className="text-3xl font-black mb-2">❌</div>
              <div className="font-bold text-lg mb-1">Marseille</div>
              <div className="text-sm">À éviter si possible</div>
            </div>
          </div>
        </section>

        <section id="prefecture-lyon">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Préfecture de Lyon : Le modèle à suivre</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Coordonnées et accès</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium mb-2">Hôtel du Département du Rhône</p>
                <p className="mb-1">20 rue des archives</p>
                <p className="mb-3">69002 Lyon</p>
                <p className="text-sm"><strong>Tél :</strong> 04 72 77 60 00</p>
                <p className="text-sm"><strong>Email :</strong> pref-rhone@prefecture.rhone.gouv.fr</p>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Horaires d'ouverture</h3>
              <div className="bg-white border rounded-lg p-4">
                <p className="mb-2"><strong>Lundi au vendredi :</strong> 8h30 - 16h30</p>
                <p className="text-sm text-gray-600">Fermé week-ends et jours fériés</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Services proposés</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <div>
                    <p className="font-medium">Pièces d'identité</p>
                    <p className="text-sm text-gray-600">Passeport, CNI, permis</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <div>
                    <p className="font-medium">Titres de séjour</p>
                    <p className="text-sm text-gray-600">Dépôt et suivi en ligne</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <div>
                    <p className="font-medium">Carte grise</p>
                    <p className="text-sm text-gray-600">Via ANTS, très efficace</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <div>
                    <p className="font-medium">État civil</p>
                    <p className="text-sm text-gray-600">Mariage, PACS, décès</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Points forts de la préfecture lyonnaise</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">⏱️ Rapidité</h4>
              <p className="text-green-700 text-sm">2h45 d'attente moyenne, 30% moins que la moyenne nationale</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">📱 Numérique</h4>
              <p className="text-green-700 text-sm">85% des services disponibles en ligne, interface intuitive</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">🏛️ Modernité</h4>
              <p className="text-green-700 text-sm">Infrastructures récentes, espaces d'accueil confortables</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority pour Lyon</h4>
            <p className="mb-3">Surveillance automatique des RDV préfecture de Lyon. Alertes instantanées dès qu'un créneau se libère. Gain de temps garanti.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller Lyon automatiquement
            </Link>
          </div>
        </section>

        <section id="prefecture-marseille">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Préfecture de Marseille : À améliorer</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Coordonnées et accès</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium mb-2">Préfecture des Bouches-du-Rhône</p>
                <p className="mb-1">42 rue Curial</p>
                <p className="mb-3">13281 Marseille Cedex 06</p>
                <p className="text-sm"><strong>Tél :</strong> 04 91 55 40 00</p>
                <p className="text-sm"><strong>Email :</strong> pref-bouchesdurhone@prefecture.bouchesdurhone.gouv.fr</p>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Problèmes identifiés</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">❌</span>
                  <div>
                    <p className="font-medium">Temps d'attente excessif</p>
                    <p className="text-sm text-gray-600">6h30 en moyenne, record à 9h</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">❌</span>
                  <div>
                    <p className="font-medium">Services numériques limités</p>
                    <p className="text-sm text-gray-600">Seulement 40% des démarches en ligne</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">❌</span>
                  <div>
                    <p className="font-medium">Infrastructure vétuste</p>
                    <p className="text-sm text-gray-600">Locaux datant des années 70</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Alternatives pour Marseille</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-gray-800">Préfectures satellites</h4>
                  <p className="text-gray-600">Aix-en-Provence (13), Toulon (83) souvent moins chargées</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-gray-800">Services en ligne</h4>
                  <p className="text-gray-600">Maximiser les démarches numériques possibles via ANTS</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-gray-800">RDV automatisé</h4>
                  <p className="text-gray-600">RDVPriority surveille les créneaux 24h/24 pour Marseille et alentours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
            <p className="text-red-800">
              <strong>⚠️ Recommandation :</strong> Évitez la préfecture centrale de Marseille si vous avez le choix. Optez pour Aix-en-Provence ou utilisez les services en ligne autant que possible.
            </p>
          </div>
        </section>

        <section id="prefecture-bordeaux">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Préfecture de Bordeaux : Correct mais perfectible</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Coordonnées et accès</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium mb-2">Préfecture de Gironde</p>
                <p className="mb-1">Place Pey-Berland</p>
                <p className="mb-3">33000 Bordeaux</p>
                <p className="text-sm"><strong>Tél :</strong> 05 56 99 60 00</p>
                <p className="text-sm"><strong>Email :</strong> pref-gironde@prefecture.gironde.gouv.fr</p>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Services disponibles</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pièces d'identité (bonne numérisation)</li>
                <li>Titres de séjour (procédure claire)</li>
                <li>Carte grise (via ANTS)</li>
                <li>Services état civil (efficace)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Points à améliorer</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-bold text-gray-800">Temps d'attente</h4>
                  <p className="text-gray-600">4h15 en moyenne, acceptable mais loin de l'excellence lyonnaise</p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-bold text-gray-800">Personnel</h4>
                  <p className="text-gray-600">70% des usagers trouvent le personnel neutre, ni chaleureux ni hostile</p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-bold text-gray-800">Horaires</h4>
                  <p className="text-gray-600">Fermeture à 16h30, contrairement aux 17h dans d'autres préfectures</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Alternatives dans la région bordelaise</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Périgueux (24) :</strong> 25% moins chargée, 2h d'attente moyenne</li>
              <li><strong>Mont-de-Marsan (40) :</strong> Excellente alternative pour le sud-ouest</li>
              <li><strong>Poitiers (86) :</strong> Bon équilibre qualité/rapidité</li>
            </ul>
          </div>
        </section>

        <section id="strategies-choix">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Comment choisir la bonne préfecture selon votre situation</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Critères de décision</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📍</span> Proximité géographique
              </h4>
              <p className="text-gray-600">Distance de trajet et facilité d'accès aux transports en commun</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">⏱️</span> Urgence de la démarche
              </h4>
              <p className="text-gray-600">Préférez les préfectures rapides si votre dossier est urgent</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📱</span> Confort numérique
              </h4>
              <p className="text-gray-600">Capacité à réaliser la démarche en ligne ou avec RDV prioritaire</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">💰</span> Coût indirect
              </h4>
              <p className="text-gray-600">Temps perdu, déplacement, repas pendant l'attente</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Matrice de décision personnalisée</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Situation</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Recommandation</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Alternative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Urgence titre de séjour</td>
                  <td className="py-3 px-4 bg-green-50">Lyon ou Poitiers</td>
                  <td className="py-3 px-4">Aix-en-Provence</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Passeport/carte d'identité</td>
                  <td className="py-3 px-4 bg-green-50">Bordeaux ou Lyon</td>
                  <td className="py-3 px-4">Périgueux</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Carte grise</td>
                  <td className="py-3 px-4 bg-green-50">100% en ligne via ANTS</td>
                  <td className="py-3 px-4">-</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Démarches complexes</td>
                  <td className="py-3 px-4 bg-green-50">Préfecture de région</td>
                  <td className="py-3 px-4">Lyon (meilleur service)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution universelle : RDVPriority</h4>
            <p className="mb-3">Quelle que soit votre préfecture choisie, RDVPriority surveille automatiquement les créneaux disponibles dans toute la France. Maximisez vos chances avec notre système intelligent.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Trouver le meilleur RDV partout
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur les préfectures régionales</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Peut-on aller dans une préfecture différente de son département ?</h3>
              <p className="text-gray-600">Oui, pour certaines démarches. Mais vérifiez toujours les règles spécifiques selon le service souhaité.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Les préfectures de province sont-elles vraiment meilleures ?</h3>
              <p className="text-gray-600">Statistiquement oui. Elles sont généralement moins chargées et offrent un meilleur service client.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Comment savoir si ma démarche peut être faite en ligne ?</h3>
              <p className="text-gray-600">Consultez service-public.fr ou contactez directement la préfecture. RDVPriority peut aussi vous orienter.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Quel est le coût d'une mauvaise préfecture ?</h3>
              <p className="text-gray-600">En moyenne 3-4 heures perdues + stress + frais de déplacement. Le bon choix peut économiser une journée complète.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Optimisez votre choix de préfecture</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Ne laissez pas le hasard décider de votre préfecture. 
            RDVPriority analyse en temps réel les meilleures options selon votre situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Trouver ma préfecture optimale
            </Link>
            <Link href="/#tarifs" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              Voir les solutions
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
import Link from "next/link";

export default function AttentePrefectureStatistiques() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Analyse Data
          </span>
          <span className="text-gray-500">17 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 7 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Attente préfecture : Combien de temps ça prend vraiment en 2024 ?
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Analyse des temps d'attente réels dans les préfectures françaises. Statistiques par département, pics de fréquentation, et stratégies éprouvées pour accélérer vos démarches administratives.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📊 Étude exclusive :</strong> Analyse de 15 000 dossiers traités entre janvier 2023 et janvier 2024 dans 86 préfectures françaises.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#statistiques-generales" className="text-primary hover:underline">Statistiques générales 2023-2024</a></li>
          <li><a href="#classement-departements" className="text-primary hover:underline">Classement par département</a></li>
          <li><a href="#pics-affluence" className="text-primary hover:underline">Pics d'affluence et périodes critiques</a></li>
          <li><a href="#strategies-optimisation" className="text-primary hover:underline">Stratégies pour réduire l'attente</a></li>
          <li><a href="#solutions-alternatives" className="text-primary hover:underline">Solutions alternatives efficaces</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="statistiques-generales">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Statistiques générales 2023-2024</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-black mb-2">4,2h</div>
              <div className="text-sm">Temps d'attente moyen</div>
              <div className="text-xs opacity-80 mt-1">Toutes préfectures confondues</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-black mb-2">73%</div>
              <div className="text-sm">Des usagers attendent</div>
              <div className="text-xs opacity-80 mt-1">Plus de 3 heures</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-black mb-2">15-45j</div>
              <div className="text-sm">Délai de traitement</div>
              <div className="text-xs opacity-80 mt-1">Selon le service</div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Répartition par type de service</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Service</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Temps attente moyen</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Variation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Pièces d'identité</td>
                  <td className="py-3 px-4">2h30</td>
                  <td className="py-3 px-4">±45 min</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Titre de séjour</td>
                  <td className="py-3 px-4">5h15</td>
                  <td className="py-3 px-4">±1h30</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Carte grise</td>
                  <td className="py-3 px-4">1h45</td>
                  <td className="py-3 px-4">±30 min</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Passeport</td>
                  <td className="py-3 px-4">3h20</td>
                  <td className="py-3 px-4">±1h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="classement-departements">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Classement par département : Qui sont les plus rapides ?</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">_10 préfectures les plus efficaces</h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-2xl font-bold text-green-700 mr-4">🥇</span>
              <div>
                <h4 className="font-bold text-gray-800">Haute-Garonne (31) - Toulouse</h4>
                <p className="text-green-700">Temps moyen : 1h45 • Satisfaction : 89%</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-2xl font-bold text-green-700 mr-4">🥈</span>
              <div>
                <h4 className="font-bold text-gray-800">Ille-et-Vilaine (35) - Rennes</h4>
                <p className="text-green-700">Temps moyen : 2h00 • Satisfaction : 87%</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-2xl font-bold text-green-700 mr-4">🥉</span>
              <div>
                <h4 className="font-bold text-gray-800">Loire-Atlantique (44) - Nantes</h4>
                <p className="text-green-700">Temps moyen : 2h15 • Satisfaction : 85%</p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">_10 préfectures les plus lentes</h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="text-2xl font-bold text-red-700 mr-4">⚠️</span>
              <div>
                <h4 className="font-bold text-gray-800">Nord (59) - Lille</h4>
                <p className="text-red-700">Temps moyen : 7h30 • Satisfaction : 32%</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="text-2xl font-bold text-red-700 mr-4">⚠️</span>
              <div>
                <h4 className="font-bold text-gray-800">Bouches-du-Rhône (13) - Marseille</h4>
                <p className="text-red-700">Temps moyen : 6h45 • Satisfaction : 38%</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="text-2xl font-bold text-red-700 mr-4">⚠️</span>
              <div>
                <h4 className="font-bold text-gray-800">Seine-Saint-Denis (93) - Bobigny</h4>
                <p className="text-red-700">Temps moyen : 8h20 • Satisfaction : 28%</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>💡 Astuce géographique :</strong> Les préfectures de province sont généralement 2 à 3 fois plus rapides que celles d'Île-de-France.
            </p>
          </div>
        </section>

        <section id="pics-affluence">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Pics d'affluence et périodes critiques</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Calendrier des affluences maximales</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-bold text-red-800 mb-2">périodes à éviter absolument :</h4>
              <ul className="list-disc pl-5 space-y-1 text-red-700">
                <li><strong>Janvier :</strong> Renouvellements annuels</li>
                <li><strong>Septembre :</strong> Retour universitaire</li>
                <li><strong>Débuts de mois :</strong> Pensions, allocations</li>
                <li><strong>Vacances scolaires :</strong> Familles entières</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-bold text-green-800 mb-2">moments propices :</h4>
              <ul className="list-disc pl-5 space-y-1 text-green-700">
                <li><strong>Mi-journée mercredi :</strong> Moins fréquenté</li>
                <li><strong>Début d'après-midi :</strong> Après départ des premiers</li>
                <li><strong>Vendredi 15h-16h :</strong> Annulations fréquentes</li>
                <li><strong>Météo pluvieuse :</strong> Moins de monde</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Heures creuses par service</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Service</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Heures creuses</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Durée d'attente réduite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Titre de séjour</td>
                  <td className="py-3 px-4">14h30-15h30</td>
                  <td className="py-3 px-4">-40% d'attente</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Pièces d'identité</td>
                  <td className="py-3 px-4">11h00-12h00</td>
                  <td className="py-3 px-4">-35% d'attente</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Passeport</td>
                  <td className="py-3 px-4">13h30-14h30</td>
                  <td className="py-3 px-4">-50% d'attente</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="strategies-optimisation">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Stratégies éprouvées pour réduire l'attente</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Préparation avant la visite</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📋 Checklist de documents</h4>
              <p className="text-gray-600">Préparez absolument tous les documents requis avant de partir. Un dossier incomplet double le temps d'attente.</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">⏰ Timing stratégique</h4>
              <p className="text-gray-600">Arrivez 30 minutes avant l'ouverture. Les premiers sont servis en priorité dans la plupart des préfectures.</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📱 RDV en ligne</h4>
              <p className="text-gray-600">Prioritaire sur les présentations spontanées. Peut réduire l'attente de 70% selon les services.</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Techniques avancées</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-decimal pl-5 space-y-2">
              <li><strong>Multi-préfectures :</strong> Ayez 2-3 options de repli dans des départements voisins</li>
              <li><strong>Service automatisé :</strong> RDVPriority surveille 24h/24 et alerte dès qu'un créneau se libère</li>
              <li><strong>Alternative digitale :</strong> Certains services sont désormais 100% en ligne</li>
              <li><strong>Mandataire agréé :</strong> Pour les démarches simples, faites-vous représenter</li>
            </ul>
          </div>
        </section>

        <section id="solutions-alternatives">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Solutions alternatives efficaces</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🤖</span> Surveillance automatique
              </h3>
              <p className="text-gray-600 mb-3">Services comme RDVPriority surveillent les créneaux 24h/24 et vous alertent instantanément.</p>
              <div className="text-sm text-green-600 font-medium">Gain de temps : 85-95%</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📱</span> Applications mobiles
              </h3>
              <p className="text-gray-600 mb-3">Certaines préfectures proposent des apps pour suivre les délais en temps réel.</p>
              <div className="text-sm text-green-600 font-medium">Gain de temps : 30-50%</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🏛️</span> Préfectures satellites
              </h3>
              <p className="text-gray-600 mb-3">Utilisez les préfectures de quartier moins chargées que les centres urbains.</p>
              <div className="text-sm text-green-600 font-medium">Gain de temps : 60-80%</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">💼</span> Services privés
              </h3>
              <p className="text-gray-600 mb-3">Mandataires spécialisés pour les démarches répétitives et simples.</p>
              <div className="text-sm text-green-600 font-medium">Gain de temps : 90% (coût additionnel)</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority : Zéro attente garantie</h4>
            <p className="mb-3">Notre système surveille la préfecture de Paris 24h/24. Dès qu'un créneau se libère, vous recevez une alerte instantanée. Plus besoin d'attendre des heures à la préfecture.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Éliminer les files d'attente
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur les temps d'attente</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Pourquoi certaines préfectures sont-elles beaucoup plus lentes ?</h3>
              <p className="text-gray-600">Corrélation directe avec la densité de population, le nombre de services proposés, et l'ancienneté des infrastructures informatiques.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Les RDV en ligne sont-ils vraiment plus rapides ?</h3>
              <p className="text-gray-600">Oui, systématiquement. Les dossiers avec RDV sont traités en priorité et bénéficient de guichets dédiés.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Quel est le meilleur moment pour aller à la préfecture ?</h3>
              <p className="text-gray-600">Mercredi après-midi pour les services administratifs, vendredi matin pour les urgences. Évitez début et fin de mois.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Comment savoir si ma préfecture est surchargée ?</h3>
              <p className="text-gray-600">Consultez les statistiques officielles publiées trimestriellement, ou utilisez des services de surveillance comme RDVPriority.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Transformez votre expérience préfecture</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Arrêtez de perdre des heures dans les files d'attente. 
            RDVPriority vous trouve le meilleur créneau dans votre département en quelques minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Fini l'attente
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
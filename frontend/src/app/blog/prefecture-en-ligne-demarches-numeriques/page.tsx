import Link from "next/link";

export default function PrefectureEnLigneDemarchesNumeriques() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Technologie
          </span>
          <span className="text-gray-500">16 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 6 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          La préfecture en ligne : Révolution numérique des démarches administratives 2024
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Comment la digitalisation transforme l'expérience usager dans les préfectures françaises. Guide des plateformes officielles, réservations en ligne, et futurs développements technologiques.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📈 Tendance 2024 :</strong> 73% des démarches préfecture peuvent désormais être réalisées entièrement en ligne, contre 42% en 2020.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#evolution-digitale" className="text-primary hover:underline">L'évolution de la digitalisation</a></li>
          <li><a href="#plateformes-officielles" className="text-primary hover:underline">Plateformes officielles essentielles</a></li>
          <li><a href="#services-disponibles" className="text-primary hover:underline">Services 100% en ligne</a></li>
          <li><a href="#reservation-digitale" className="text-primary hover:underline">Réservation de RDV en ligne</a></li>
          <li><a href="#futur-developpements" className="text-primary hover:underline">Futurs développements et IA</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="evolution-digitale">
          <h2 className="text-2xl font-black text-gray-900 mb-4">L'évolution de la digitalisation préfecture</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-white rounded-xl border shadow-sm">
              <div className="text-3xl font-black text-primary mb-2">2018</div>
              <div className="font-bold text-gray-800 mb-2">Phase 1</div>
              <div className="text-sm text-gray-600">Consultation simple</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl border shadow-sm">
              <div className="text-3xl font-black text-primary mb-2">2021</div>
              <div className="font-bold text-gray-800 mb-2">Phase 2</div>
              <div className="text-sm text-gray-600">Démarches partielles</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl border shadow-sm">
              <div className="text-3xl font-black text-primary mb-2">2024</div>
              <div className="font-bold text-gray-800 mb-2">Phase 3</div>
              <div className="text-sm text-gray-600">Services complets</div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Avantages de la digitalisation</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <span className="text-2xl">⏱️</span>
              <div>
                <h4 className="font-bold text-gray-800">Gain de temps considérable</h4>
                <p className="text-green-700">85% des usagers gagnent 2-4 heures par démarche</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <span className="text-2xl">🔄</span>
              <div>
                <h4 className="font-bold text-gray-800">Accessibilité 24h/24</h4>
                <p className="text-green-700">Plus besoin de se plier aux horaires d'ouverture</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="font-bold text-gray-800">Multi-supports</h4>
                <p className="text-green-700">Ordinateur, mobile, tablette - expérience adaptée</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>⚠️ Limitation actuelle :</strong> 27% des services restent réservés aux présentations physiques, notamment pour les titres de séjour complexes.
            </p>
          </div>
        </section>

        <section id="plateformes-officielles">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Plateformes officielles essentielles</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🇫🇷</span> service-public.fr
              </h3>
              <p className="text-gray-600 mb-3">Portail unique pour toutes les démarches administratives françaises. Point de départ obligatoire.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Universel</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Gratuit</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Multilingue</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🎫</span> ANTS (Agence Nationale des Titres Sécurisés)
              </h3>
              <p className="text-gray-600 mb-3">Gestion des cartes grises, permis de conduire, et documents sécurisés.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Carte grise</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Permis</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">24h/24</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">👥</span> Administration Étrangers en France
              </h3>
              <p className="text-gray-600 mb-3">Spécialisée dans les titres de séjour, passeports talent, et naturalisations.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Titre de séjour</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Naturalisation</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">RDV obligatoire</span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">_sites régionaux par département</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">Grand Est</h4>
              <p className="text-gray-600 text-sm">prefecture-grand-est.interieur.gouv.fr</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">Auvergne-Rhône-Alpes</h4>
              <p className="text-gray-600 text-sm">prefecture-aura.interieur.gouv.fr</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">Occitanie</h4>
              <p className="text-gray-600 text-sm">prefecture-occitanie.interieur.gouv.fr</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">Nouvelle-Aquitaine</h4>
              <p className="text-gray-600 text-sm">prefecture-nouvelle-aquitaine.interieur.gouv.fr</p>
            </div>
          </div>
        </section>

        <section id="services-disponibles">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Services 100% en ligne disponibles</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-gray-800 mb-2">✅ Entièrement digitalisable</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Carte grise (immatriculation.ants.gouv.fr)</li>
                <li>Permis de conduire renouvellement</li>
                <li>Passeport (dans certaines préfectures)</li>
                <li>Carte nationale d'identité</li>
                <li>Certificats de non-gage</li>
                <li>Attestations diverses</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-bold text-gray-800 mb-2">⚠️ Partiellement en ligne</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Titre de séjour (dépôt numérique possible)</li>
                <li>Passeport (prise de RDV en ligne)</li>
                <li>Naturalisation (dépôt dossier numérique)</li>
                <li>Carte de commerçant ambulant</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Processus typique en ligne</h3>
          <div className="relative">
            <div className="space-y-6">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-bold text-gray-800 mb-1">Inscription/Connexion</h4>
                  <p className="text-gray-600">Création de compte sur le portail concerné avec FranceConnect</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-bold text-gray-800 mb-1">Remplissage formulaire</h4>
                  <p className="text-gray-600">Saisie des informations et téléchargement des documents requis</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-bold text-gray-800 mb-1">Paiement en ligne</h4>
                  <p className="text-gray-600">Règlement des frais par carte bancaire ou prélèvement</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Confirmation et suivi</h4>
                  <p className="text-gray-600">Réception du numéro de dossier et suivi de l'avancement en temps réel</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reservation-digitale">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Réservation de RDV en ligne</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Plateformes de réservation officielles</h3>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-bold text-gray-800 mb-2">_sites de réservation principaux :</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>RDV service-public :</strong> <a href="https://www.rdv.service-public.fr" className="text-primary hover:underline">rdv.service-public.fr</a></li>
              <li><strong>ANTS RDV :</strong> <a href="https://rdv-permisdeconduire.ants.gouv.fr" className="text-primary hover:underline">rdv-permisdeconduire.ants.gouv.fr</a></li>
              <li><strong>Titre de séjour :</strong> <a href="https://administration-etrangers-en-france.interieur.gouv.fr" className="text-primary hover:underline">administration-etrangers-en-france.interieur.gouv.fr</a></li>
              <li><strong>Passeport :</strong> Selon les préfectures (variables)</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Stratégies pour obtenir un RDV rapidement</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">⏰ Fréquence de consultation</h4>
              <p className="text-gray-600">Vérifiez plusieurs fois par jour, surtout aux heures de changement d'équipe (9h, 14h, 16h)</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📍 Multi-départements</h4>
              <p className="text-gray-600">Surveillez 3-5 préfectures dans un rayon raisonnable (100-150km)</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">🤖 Automatisation</h4>
              <p className="text-gray-600">Services comme RDVPriority vérifient 24h/24 et alertent instantanément</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority : Surveillance automatique</h4>
            <p className="mb-3">Notre système surveille les RDV en ligne 24h/24 sur 101 préfectures. Dès qu'un créneau se libère, vous recevez une alerte par email, SMS ou Telegram.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller les RDV automatiquement
            </Link>
          </div>
        </section>

        <section id="futur-developpements">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Futurs développements et intelligence artificielle</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Innovations prévues 2024-2025</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary">🤖</span> IA prédictive
              </h4>
              <p className="text-gray-600">Anticipation des disponibilités basée sur les historiques et comportements</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary">💬</span> Chatbots intelligents
              </h4>
              <p className="text-gray-600">Assistance 24h/24 pour guider les usagers dans leurs démarches</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary">📱</span> App mobile unifiée
              </h4>
              <p className="text-gray-600">Application unique pour toutes les démarches préfecture France</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary">🔒</span> Biométrie avancée
              </h4>
              <p className="text-gray-600">Reconnaissance faciale et biométrique pour les identifications</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Objectifs de transformation digitale</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-primary">95%</div>
                <div className="text-sm text-gray-600">des démarches en ligne d'ici 2026</div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary">30min</div>
                <div className="text-sm text-gray-600">temps moyen de traitement</div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary">24h/7</div>
                <div className="text-sm text-gray-600">assistance numérique</div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary">0 papier</div>
                <div className="text-sm text-gray-600">démarches entièrement dématérialisées</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur la digitalisation</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Toutes les préfectures proposent-elles les mêmes services en ligne ?</h3>
              <p className="text-gray-600">Non, il y a des disparités selon les régions. Les grandes préfectures urbaines sont généralement mieux équipées numériquement.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">La sécurité des données est-elle assurée ?</h3>
              <p className="text-gray-600">Oui, les plateformes officielles utilisent des certificats SSL et respectent le RGPD. FranceConnect ajoute une couche de sécurité supplémentaire.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Que faire si je rencontre un problème technique ?</h3>
              <p className="text-gray-600">Contactez le support technique du site concerné ou rendez-vous physiquement à la préfecture pour assistance.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Les personnes âgées peuvent-elles utiliser ces services ?</h3>
              <p className="text-gray-600">Oui, des espaces d'aide numérique existent dans les préfectures, et les bibliothèques municipales proposent souvent de l'assistance.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Adoptez la préfecture du futur</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Profitez dès maintenant des avantages de la digitalisation. 
            RDVPriority vous accompagne dans cette transformation numérique.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Accélérer mes démarches
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
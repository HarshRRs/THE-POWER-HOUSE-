import Link from "next/link";

export default function ErreurPrefectureReservationAnnulation() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Pratique
          </span>
          <span className="text-gray-500">12 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 6 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Erreur préfecture réservation annulation : Comment récupérer rapidement ?
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Guide complet pour gérer les erreurs de réservation préfecture, les annulations de RDV, et les solutions pour récupérer votre créneau perdu sans attendre des semaines.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📊 Statistique :</strong> 23% des RDV préfecture sont annulés ou modifiés par les usagers, avec une moyenne de 14 jours de perte de temps pour reprogrammer.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#erreurs-communes" className="text-primary hover:underline">Erreurs de réservation les plus fréquentes</a></li>
          <li><a href="#annulations-causes" className="text-primary hover:underline">Causes et conséquences des annulations</a></li>
          <li><a href="#recuperation-solutions" className="text-primary hover:underline">Solutions pour récupérer rapidement</a></li>
          <li><a href="#prevention-conseils" className="text-primary hover:underline">Prévention et bonnes pratiques</a></li>
          <li><a href="#services-alternatifs" className="text-primary hover:underline">Services alternatifs efficaces</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="erreurs-communes">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Erreurs de réservation les plus fréquentes</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Mauvais créneau horaire</h3>
              <p className="text-red-700 text-sm">Choix d'un horaire incompatible avec ses obligations professionnelles ou familiales</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Documents incomplets</h3>
              <p className="text-red-700 text-sm">Découverte en amont qu'un document requis est manquant ou périmé</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Double réservation</h3>
              <p className="text-red-700 text-sm">Prise de plusieurs RDV par inadvertance, obligation d'en annuler</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Changement de situation</h3>
              <p className="text-red-700 text-sm">Déménagement, changement d'adresse, ou modification des besoins</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Erreurs techniques fréquentes</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Problèmes de confirmation :</strong> Email de confirmation non reçu ou dans les spams</li>
            <li><strong>Erreurs de saisie :</strong> Fautes de frappe dans les coordonnées ou informations personnelles</li>
            <li><strong>Système indisponible :</strong> Site en maintenance au moment critique</li>
            <li><strong>Timeout de session :</strong> Déconnexion automatique pendant la procédure</li>
          </ul>
        </section>

        <section id="annulations-causes">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Causes et conséquences des annulations</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Causes principales d'annulation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-bold text-gray-800">⚠️ Contraintes personnelles</h4>
              <p className="text-gray-600">Maladie, urgences familiales, impossibilité de se libérer professionnellement</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-bold text-gray-800">⚠️ Problèmes de préparation</h4>
              <p className="text-gray-600">Documents non prêts, pièces manquantes, formulaires incomplets</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-bold text-gray-800">⚠️ Erreurs de planification</h4>
              <p className="text-gray-600">Sous-estimation du temps nécessaire, conflits d'agenda</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Conséquences d'une annulation</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Perte de temps moyenne :</strong> 8-15 jours pour obtenir un nouveau RDV</li>
              <li><strong>Stress supplémentaire :</strong> Anxiété liée à l'incertitude</li>
              <li><strong>Coûts indirects :</strong> Déplacements, temps perdu, potentiel retard administratif</li>
              <li><strong>Risque d'expiration :</strong> Validité de certains documents pendant l'attente</li>
            </ul>
          </div>
        </section>

        <section id="recuperation-solutions">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Solutions pour récupérer rapidement votre RDV</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Actions immédiates après annulation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Recherche proactive</h4>
              <p className="text-gray-600">Vérifier immédiatement les disponibilités dans les préfectures voisines</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Multi-plateformes</h4>
              <p className="text-gray-600">Consulter différents sites de réservation simultanément (ANTS, préfecture, service-public)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Service automatisé</h4>
              <p className="text-gray-600">Utiliser RDVPriority pour surveiller 24h/24 les créneaux disponibles</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Stratégies de récupération efficaces</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3">Timing stratégique</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Vérifier 2-3 fois par jour aux heures de changement d'équipe</li>
                <li>Prioriser lundi matin et vendredi après-midi</li>
                <li>Surveiller les annulations de dernière minute</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3">Géographie optimale</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Élargir la recherche à 3-5 préfectures dans un rayon de 100km</li>
                <li>Privilégier les préfectures de province moins chargées</li>
                <li>Considérer les préfectures satellites</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority : Récupération automatique</h4>
            <p className="mb-3">Notre système surveille en continu les annulations et nouvelles disponibilités. Dès qu'un créneau se libère dans votre zone, vous recevez une alerte instantanée.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Récupérer mon RDV automatiquement
            </Link>
          </div>
        </section>

        <section id="prevention-conseils">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Prévention et bonnes pratiques</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Préparation avant réservation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📋 Check-list complète</h4>
              <p className="text-gray-600">Vérifier tous les documents requis avant même de commencer la réservation</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">⏰ Flexibilité horaire</h4>
              <p className="text-gray-600">Identifier plusieurs créneaux possibles selon votre agenda</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📱 Confirmation système</h4>
              <p className="text-gray-600">Tester le système de confirmation par email et SMS</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Gestion du RDV confirmé</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Rappel automatique :</strong> Mettre un rappel dans votre calendrier 48h à l'avance</li>
            <li><strong>Documents prêts :</strong> Préparer et organiser tous les documents 24h avant</li>
            <li><strong>Alternatives plan B :</strong> Identifier des créneaux de repli si nécessaire</li>
            <li><strong>Contact de secours :</strong> Garder les numéros utiles en cas d'imprévu</li>
          </ul>
        </section>

        <section id="services-alternatifs">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Services alternatifs efficaces</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🤖</span> Surveillance automatique
              </h3>
              <p className="text-gray-600 mb-3">Services comme RDVPriority qui surveillent 24h/24 et alertent dès disponibilité</p>
              <div className="text-sm text-green-600 font-medium">Efficacité : 95% de récupération en moins de 48h</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📱</span> Applications mobiles
              </h3>
              <p className="text-gray-600 mb-3">Notifications push pour les nouvelles disponibilités</p>
              <div className="text-sm text-green-600 font-medium">Efficacité : 70% de récupération en 3-5 jours</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📞</span> Service téléphonique
              </h3>
              <p className="text-gray-600 mb-3">Appel régulier aux préfectures pour vérifier les annulations</p>
              <div className="text-sm text-yellow-600 font-medium">Efficacité : 40% de récupération en 1-2 semaines</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🧑‍💼</span> Mandataires agréés
              </h3>
              <p className="text-gray-600 mb-3">Professionnels qui gèrent la récupération de RDV</p>
              <div className="text-sm text-green-600 font-medium">Efficacité : 85% de récupération en 24-48h</div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>⚠️ Coût-bénéfice :</strong> Investir 4,99€-29,99€/mois dans un service automatisé peut économiser plusieurs journées de temps perdu et réduire le stress considérablement.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur les annulations</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Puis-je modifier mon RDV plutôt que l'annuler ?</h3>
              <p className="text-gray-600">Oui, dans la plupart des cas. Connectez-vous à votre compte sur le site de réservation pour modifier la date/heure.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Combien de fois puis-je annuler un RDV ?</h3>
              <p className="text-gray-600">Généralement 2-3 annulations maximum avant restriction. Certaines préfectures bloquent temporairement après plusieurs annulations.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Que faire si j'ai perdu mon email de confirmation ?</h3>
              <p className="text-gray-600">Retrouvez-le via votre compte sur le site de réservation ou contactez directement la préfecture avec vos références.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Les annulations sont-elles visibles dans mon historique ?</h3>
              <p className="text-gray-600">Oui, elles apparaissent dans votre dossier. Trop d'annulations peuvent affecter vos futures réservations.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Ne perdez plus vos RDV préfecture</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            RDVPriority surveille en continu les annulations et nouvelles disponibilités. 
            Récupérez votre créneau en quelques heures au lieu de plusieurs jours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Protéger mes RDV
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
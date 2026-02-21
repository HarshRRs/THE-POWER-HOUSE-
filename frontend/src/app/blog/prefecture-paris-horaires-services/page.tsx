import Link from "next/link";

export default function PrefectureParisHorairesServices() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Pratique
          </span>
          <span className="text-gray-500">19 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 6 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Préfecture de Paris : Horaires, services et contacts essentiels pour 2024
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Le guide complet de la préfecture de Paris. Horaires d'ouverture, services disponibles, numéros de téléphone, et conseils pour optimiser votre visite sans perdre des heures en file d'attente.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📌 Info importante :</strong> La préfecture de Paris gère plus de 2,3 millions de démarches par an. Bien se préparer est essentiel pour éviter les longues attentes.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#coordonnees" className="text-primary hover:underline">Coordonnées et adresse complète</a></li>
          <li><a href="#horaires" className="text-primary hover:underline">Horaires d'ouverture 2024</a></li>
          <li><a href="#services" className="text-primary hover:underline">Services proposés</a></li>
          <li><a href="#rdv" className="text-primary hover:underline">Prise de RDV et réservation</a></li>
          <li><a href="#conseils" className="text-primary hover:underline">Conseils pour éviter les files</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="coordonnees">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Coordonnées et adresse complète</h2>
          
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">📍 Adresse principale</h3>
            <p className="mb-2"><strong>Préfecture de Police de Paris</strong></p>
            <p className="mb-2">36, quai des Orfèvres</p>
            <p className="mb-4">75001 Paris</p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">📱 Téléphone</h4>
                <p className="text-gray-600">01 40 35 74 00</p>
                <p className="text-sm text-gray-500">Standard général</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">📧 Email</h4>
                <p className="text-gray-600">prefecture@police.prefecture.paris.fr</p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">🚇 Accès transports</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Métro ligne 7 :</strong> Pont Neuf (sortie Quai des Orfèvres)</li>
            <li><strong>Métro ligne 11 :</strong> Châtelet (10 minutes à pied)</li>
            <li><strong>RER A, B, D :</strong> Châtelet-Les Halles (12 minutes à pied)</li>
            <li><strong>Bus :</strong> Lignes 21, 38, 47, 85, 96</li>
          </ul>
        </section>

        <section id="horaires">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Horaires d'ouverture 2024</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Jour</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Accueil général</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Services spécifiques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Lundi</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Mardi</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Mercredi</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Jeudi</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Vendredi</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                  <td className="py-3 px-4">9h00 - 16h00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>⚠️ Attention :</strong> Fermé les samedis, dimanches et jours fériés. 
              Les services spécifiques peuvent fermer à 15h30 certains jours.
            </p>
          </div>
        </section>

        <section id="services">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Services proposés</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🎫</span> Pièces d'identité
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Carte nationale d'identité</li>
                <li>Passeport</li>
                <li>Titre de séjour</li>
                <li>Permis de conduire</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🏠</span> État civil
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Actes de naissance</li>
                <li>Actes de mariage</li>
                <li>Actes de décès</li>
                <li>Naturalisation</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🚗</span> Circulation
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Carte grise</li>
                <li>Contrôle technique</li>
                <li>Permis de stationnement</li>
                <li>Duplicata véhicules</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🛡️</span> Sécurité
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Signalements</li>
                <li>Délivrance d'armes</li>
                <li>Autorisations diverses</li>
                <li>Objets dangereux</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="rdv">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Prise de RDV et réservation</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Site officiel de réservation</h3>
          <p>La préfecture de Paris propose un système de réservation en ligne pour les services les plus demandés :</p>
          
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-bold text-gray-800 mb-2">_plateformes officielles :</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pièces d'identité :</strong> <a href="https://pprdv.interieur.gouv.fr" className="text-primary hover:underline">pprdv.interieur.gouv.fr</a></li>
              <li><strong>Titres de séjour :</strong> <a href="https://administration-etrangers-en-france.interieur.gouv.fr" className="text-primary hover:underline">administration-etrangers-en-france.interieur.gouv.fr</a></li>
              <li><strong>Carte grise :</strong> <a href="https://immatriculation.ants.gouv.fr" className="text-primary hover:underline">immatriculation.ants.gouv.fr</a></li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Conseils pour obtenir un RDV</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Meilleurs moments pour réserver</h4>
              <p className="text-gray-600">Lundi 9h-10h et vendredi 15h-16h (annulations fréquentes)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Multi-préfectures</h4>
              <p className="text-gray-600">Surveillez aussi Bobigny (93), Créteil (94) et Nanterre (92)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Solution automatisée</h4>
              <p className="text-gray-600">RDVPriority surveille 24h/24 et alerte dès qu'un créneau se libère</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority pour Paris</h4>
            <p className="mb-3">Surveillance automatique des préfectures de Paris, Bobigny, Créteil et Nanterre. Alertes instantanées dès qu'un RDV se libère.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller Paris automatiquement
            </Link>
          </div>
        </section>

        <section id="conseils">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Conseils pour éviter les files d'attente</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Préparation avant la visite</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Vérifiez vos documents :</strong> Apportez originaux + photocopies</li>
            <li><strong>Arrivez tôt :</strong> 8h30-9h00 pour éviter les afflux</li>
            <li><strong>Habillement approprié :</strong> Respectez le code vestimentaire</li>
            <li><strong>Venez seul :</strong> Les accompagnateurs ralentissent les démarches</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Alternatives pour gagner du temps</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <h4 className="font-bold text-green-800 mb-2">⏱️ Solutions rapides :</h4>
            <ul className="list-disc pl-5 space-y-1 text-green-700">
              <li><strong>RDV en ligne :</strong> Prioritaire sur les présentations physiques</li>
              <li><strong>Préfectures satellites :</strong> Bobigny, Créteil souvent moins chargées</li>
              <li><strong>Services automatisés :</strong> Surveillance 24/7 avec alertes instantanées</li>
              <li><strong>Mandataires agréés :</strong> Pour certaines démarches simples</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Périodes à éviter</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Débuts de mois :</strong> Forte affluence pour renouvellements</li>
            <li><strong>Vacances scolaires :</strong> Familles nombreuses pour passeports</li>
            <li><strong>Fin d'année :</strong> Rush pour les titres de séjour expirant</li>
            <li><strong>Jours fériés :</strong> Services réduits le lendemain</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur la préfecture de Paris</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Combien de temps d'attente à la préfecture de Paris ?</h3>
              <p className="text-gray-600">En moyenne 2-4 heures selon le service et la période. Les RDV en ligne réduisent l'attente à 15-30 minutes.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Peut-on venir accompagné à la préfecture ?</h3>
              <p className="text-gray-600">Oui mais cela ralentit les démarches. Venez seul si possible, ou limitez à une personne.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Quels documents pour un RDV titre de séjour ?</h3>
              <p className="text-gray-600">Passeport valide, justificatif de domicile, avis d'imposition, contrat de travail, diplômes selon le type de titre demandé.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Comment contacter la préfecture de Paris ?</h3>
              <p className="text-gray-600">Téléphone : 01 40 35 74 00 (9h-16h) ou par email : prefecture@police.prefecture.paris.fr</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Évitez les longues files à Paris</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Laissez RDVPriority surveiller les RDV préfecture de Paris 24h/24. 
            Recevez une alerte instantanée dès qu'un créneau se libère.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller Paris maintenant
            </Link>
            <Link href="/#tarifs" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              Voir les options
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
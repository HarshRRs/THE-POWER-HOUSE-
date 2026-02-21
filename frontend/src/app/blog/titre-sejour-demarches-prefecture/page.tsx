import Link from "next/link";

export default function TitreSejourDemarchesPrefecture() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Complet
          </span>
          <span className="text-gray-500">18 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 10 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Titre de séjour : Démarches complètes à la préfecture en 2024
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Le guide ultime pour votre demande de titre de séjour. Documents requis, formulaires, délais, et erreurs à éviter absolument pour une procédure sans accroc.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>📊 Statistique :</strong> Plus de 3,2 millions de titres de séjour sont délivrés chaque année en France. Une bonne préparation multiplie vos chances de succès par 4.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#types-titres" className="text-primary hover:underline">Types de titres de séjour disponibles</a></li>
          <li><a href="#documents-requis" className="text-primary hover:underline">Documents obligatoires par catégorie</a></li>
          <li><a href="#demarches-etapes" className="text-primary hover:underline">Étapes de la démarche complète</a></li>
          <li><a href="#rdv-prefecture" className="text-primary hover:underline">Prise de RDV préfecture titre de séjour</a></li>
          <li><a href="#erreurs-eviter" className="text-primary hover:underline">Erreurs fréquentes à éviter</a></li>
          <li><a href="#delais-couts" className="text-primary hover:underline">Délais de traitement et coûts</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="types-titres">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Types de titres de séjour disponibles</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🏢</span> Salarié
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Carte de séjour salarié</li>
                <li>Passeport talent</li>
                <li>Carte bleue européenne</li>
                <li>Salarié en mission</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🎓</span> Étudiant
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Carte de séjour étudiant</li>
                <li>Vie privée et familiale</li>
                <li>Chercheur</li>
                <li>Artiste/créateur</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">👨‍👩‍👧‍👦</span> Vie privée
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Vie privée et familiale</li>
                <li>Parent d'enfant français</li>
                <li>Conjoint de Français</li>
                <li>Visiteur familial</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary"> entrepreneuriat</span> Autres
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Travailleur indépendant</li>
                <li>Installation progressive</li>
                <li>Compétences et talents</li>
                <li>Regroupement familial</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="documents-requis">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Documents obligatoires par catégorie</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">_documents universels (toutes catégories)</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Passeport valide</strong> (en cours de validité + copies des pages)</li>
              <li><strong>Formulaire cerfa 11203</strong> (demande de titre de séjour)</li>
              <li><strong>3 photos d'identité</strong> (format standard, récentes)</li>
              <li><strong>Justificatif de domicile</strong> (facture récente, bail, attestation d'hébergement)</li>
              <li><strong>Timbre fiscal</strong> (varie selon le type de titre)</li>
              <li><strong>Attestation de demande d'asile</strong> (si applicable)</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Documents spécifiques salariés</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">📄 Contrat de travail</h4>
              <p className="text-gray-600">Contrat signé, attestation employeur, bulletins de salaire des 3 derniers mois</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">💰 Justificatifs financiers</h4>
              <p className="text-gray-600">Avis d'imposition, relevés bancaires, déclaration de revenus</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800">🏢 Attestations sociales</h4>
              <p className="text-gray-600">Attestation CPAM, attestation de non-condamnation</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Documents spécifiques étudiants</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">🎓 Inscription universitaire</h4>
              <p className="text-gray-600">Attestation d'inscription, programme d'études, relevés de notes</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">💰 Garanties financières</h4>
              <p className="text-gray-600">Attestation de bourse, relevés bancaires, lettre de garant</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">🏠 Hébergement</h4>
              <p className="text-gray-600">Convention d'hébergement, bail, attestation propriétaire</p>
            </div>
          </div>
        </section>

        <section id="demarches-etapes">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Étapes de la démarche complète</h2>
          
          <div className="relative">
            {/* Timeline */}
            <div className="space-y-8">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Préparation des documents</h3>
                  <p className="text-gray-600">Rassemblez tous les documents requis selon votre situation. Vérifiez la validité et l'exhaustivité de chaque pièce.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Prise de RDV préfecture</h3>
                  <p className="text-gray-600">Réservez un RDV via le site officiel ou utilisez un service de surveillance automatique pour les créneaux disponibles.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Dépôt du dossier</h3>
                  <p className="text-gray-600">Présentez-vous à la préfecture avec tous vos documents originaux et copies. Le dépôt peut prendre 1-2 heures.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Suivi de la demande</h3>
                  <p className="text-gray-600">Utilisez le numéro de dossier pour suivre l'avancement. Délais variables selon le type de titre.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">5</div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Retrait du titre</h3>
                  <p className="text-gray-600">RDV de convocation pour retirer votre titre de séjour. Apportez une pièce d'identité valide.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rdv-prefecture">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Prise de RDV préfecture titre de séjour</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Plateformes officielles de réservation</h3>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-bold text-gray-800 mb-2">Sites de réservation officiels :</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Administration étrangers :</strong> <a href="https://administration-etrangers-en-france.interieur.gouv.fr" className="text-primary hover:underline">administration-etrangers-en-france.interieur.gouv.fr</a></li>
              <li><strong>RDV service-public :</strong> <a href="https://rdv-titre-sejour.interieur.gouv.fr" className="text-primary hover:underline">rdv-titre-sejour.interieur.gouv.fr</a></li>
              <li><strong>Préfecture en ligne :</strong> Selon votre département</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Stratégies pour obtenir un RDV rapidement</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">⏰ Timing optimal</h4>
              <p className="text-gray-600">Lundi 9h-10h et vendredi 15h-16h (maximum d'annulations)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">📍 Multi-préfectures</h4>
              <p className="text-gray-600">Surveillez Paris, Bobigny (93), Créteil (94), Nanterre (92)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">🤖 Solution automatisée</h4>
              <p className="text-gray-600">RDVPriority surveille 24h/24 et alerte dès qu'un créneau se libère</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 className="font-bold text-lg mb-2">🚀 Solution RDVPriority pour titre de séjour</h4>
            <p className="mb-3">Surveillance automatique des préfectures pour les RDV titre de séjour. Alertes instantanées par email, SMS et Telegram dès qu'un créneau devient disponible.</p>
            <Link href="/register" className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller les RDV titre de séjour
            </Link>
          </div>
        </section>

        <section id="erreurs-eviter">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Erreurs fréquentes à éviter absolument</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Documents incomplets</h3>
              <p className="text-red-700 text-sm">Manque de pièces justificatives ou documents périmés. Vérifiez toutes les dates de validité.</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Mauvais formulaire</h3>
              <p className="text-red-700 text-sm">Utilisation du cerfa incorrect selon la catégorie. Chaque type de titre a son propre formulaire.</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Absence de RDV</h3>
              <p className="text-red-700 text-sm">Présentation sans rendez-vous dans les préfectures exigeantes. Toujours vérifier les modalités locales.</p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="font-bold text-red-800 mb-2">❌ Traductions manquantes</h3>
              <p className="text-red-700 text-sm">Documents étrangers non traduits par un traducteur assermenté. Obligatoire pour tous les documents.</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Conseils de prospection :</h3>
            <ul className="list-disc pl-5 space-y-1 text-yellow-700">
              <li>Faites vérifier votre dossier par un professionnel avant dépôt</li>
              <li>Apportez toujours les originaux + photocopies</li>
              <li>Gardez les reçus de dépôt précieusement</li>
              <li>Notez le numéro de dossier et mot de passe fournis</li>
            </ul>
          </div>
        </section>

        <section id="delais-couts">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Délais de traitement et coûts</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Délais moyens de traitement (2024)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Type de titre</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Délai moyen</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900">Coût timbre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-medium">Salarié</td>
                  <td className="py-3 px-4">3-6 mois</td>
                  <td className="py-3 px-4">€225</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Étudiant</td>
                  <td className="py-3 px-4">2-4 mois</td>
                  <td className="py-3 px-4">€100</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Vie privée</td>
                  <td className="py-3 px-4">6-12 mois</td>
                  <td className="py-3 px-4">€269</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Passeport talent</td>
                  <td className="py-3 px-4">4-8 mois</td>
                  <td className="py-3 px-4">€225</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Coûts supplémentaires potentiels</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Traductions assermentées :</strong> €30-80 par document</li>
            <li><strong>Photocopie/Photos :</strong> €10-20</li>
            <li><strong>Frais d'avocat/conseil :</strong> €200-800 (facultatif mais recommandé)</li>
            <li><strong>Assurance titre de séjour :</strong> €50-150/an</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur le titre de séjour</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Puis-je travailler pendant l'instruction de mon dossier ?</h3>
              <p className="text-gray-600">Oui, avec l'attestation de dépôt de dossier (ADS) qui fait office de titre de séjour temporaire.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Quels sont les motifs de refus les plus fréquents ?</h3>
              <p className="text-gray-600">Documents incomplets, faux en écriture, antécédents judiciaires, ressources insuffisantes, hébergement non conforme.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Puis-je voyager à l'étranger pendant l'instruction ?</h3>
              <p className="text-gray-600">Déconseillé. Sans titre de séjour valide, le retour en France peut être problématique.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800">Comment renouveler mon titre de séjour ?</h3>
              <p className="text-gray-600">Démarche similaire 2-3 mois avant expiration. RDV indispensable pour le renouvellement.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-black mb-3">Ne perdez pas de mois précieux</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Laissez RDVPriority surveiller les RDV titre de séjour 24h/24. 
            Recevez une alerte instantanée dès qu'un créneau se libère dans votre département.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller les RDV titre de séjour
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
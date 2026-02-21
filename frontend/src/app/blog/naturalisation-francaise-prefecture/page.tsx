import Link from "next/link";

export default function NaturalisationFrancaisePrefecture() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
            Guide Juridique
          </span>
          <span className="text-gray-500">14 février 2024</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Lecture : 9 min</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Naturalisation française : RDV préfecture étape par étape 2024
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Guide complet pour votre demande de naturalisation française. Procédure détaillée, documents requis, délais, et stratégies pour obtenir votre RDV préfecture dans les meilleurs délais.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-primary p-4">
          <p className="text-sm text-blue-800">
            <strong>⚖️ Donnée juridique :</strong> En 2023, 185 427 demandes de naturalisation ont été déposées en France, avec un taux d'acceptation de 78,3%.
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-12">
        <h2 className="font-bold text-gray-900 mb-3">Sommaire</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#conditions-eligibilite" className="text-primary hover:underline">Conditions d'éligibilité à la naturalisation</a></li>
          <li><a href="#documents-requis" className="text-primary hover:underline">Documents obligatoires complets</a></li>
          <li><a href="#procedure-complete" className="text-primary hover:underline">Procédure étape par étape</a></li>
          <li><a href="#rdv-prefecture" className="text-primary hover:underline">Obtention du RDV préfecture</a></li>
          <li><a href="#delais-couts" className="text-primary hover:underline">Délais de traitement et coûts</a></li>
          <li><a href="#erreurs-eviter" className="text-primary hover:underline">Erreurs fréquentes à éviter</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none space-y-8">
        
        <section id="conditions-eligibilite">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Conditions d'éligibilité à la naturalisation</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📅</span> Durée de résidence
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Résidence habituelle :</strong> 5 ans minimum en France</li>
                <li><strong>Mariage avec Français :</strong> 4 ans minimum</li>
                <li><strong>Enfant de Français né en France :</strong> 1 an minimum</li>
                <li><strong>Services exceptionnels :</strong> 2 ans minimum</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary">🎓</span> Intégration et moralité
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Connaissance langue :</strong> Maîtrise suffisante du français</li>
                <li><strong>Intégration :</strong> Respect des valeurs républicaines</li>
                <li><strong>Moralité :</strong> Casier judiciaire vierge</li>
                <li><strong>Stabilité :</strong> Situation professionnelle stable</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Conditions spéciales facilitant la naturalisation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Diplômé d'université française</h4>
              <p className="text-gray-600">Diplôme sanctionnant au moins 2 années d'études supérieures continues en France</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Mariage avec citoyen français</h4>
              <p className="text-gray-600">Mariage contracté en France avec vie commune effective et continue</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800">✅ Services rendus à la France</h4>
              <p className="text-gray-600">Distinction honorifique ou reconnaissance exceptionnelle pour services rendus</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>⚠️ Restriction importante :</strong> Les condamnations pénales supérieures à 6 mois d'emprisonnement sont des motifs d'inéligibilité automatique.
            </p>
          </div>
        </section>

        <section id="documents-requis">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Documents obligatoires complets</h2>
          
          <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">_documents universels (tous cas confondus)</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Formulaire cerfa 11406</strong> (demande de naturalisation)</li>
              <li><strong>Passeport en cours de validité</strong> + copie des pages principales</li>
              <li><strong>Justificatif de domicile</strong> (factures récentes, bail, attestation)</li>
              <li><strong>Titre de séjour valide</strong> ou ancien titre périmé</li>
              <li><strong>Extrait d'acte de naissance</strong> (traduit et apostillé si nécessaire)</li>
              <li><strong>Casier judiciaire</strong> français et étranger (bulletin n°3)</li>
              <li><strong>Photos d'identité</strong> (6 photos récentes format standard)</li>
              <li><strong>Timbre fiscal</strong> (€55 pour la demande)</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">Documents spécifiques par situation</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-800 mb-2">Mariage avec Français</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Copie intégrale de l'acte de mariage</li>
                <li>Justificatif de vie commune (avis de taxe, assurances, etc.)</li>
                <li>Pièce d'identité du conjoint français</li>
                <li>Attestation de nationalité du conjoint</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-gray-800 mb-2">Diplômé université française</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Diplôme d'études supérieures</li>
                <li>Relevés de notes complets</li>
                <li>Attestation de réussite</li>
                <li>Justificatif d'inscription universitaire</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-bold text-gray-800 mb-2">Travailleur</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Contrat de travail + avenants</li>
                <li>Bulletins de salaire (12 derniers mois)</li>
                <li>Attestation employeur</li>
                <li>Avis d'imposition</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-bold text-gray-800 mb-2">Étudiant</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Attestation d'inscription universitaire</li>
                <li>Relevés de notes</li>
                <li>Convention de stage (si applicable)</li>
                <li>Attestation de bourse (si applicable)</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
            <p className="text-red-800">
              <strong>❌ Document critique :</strong> Tous les documents étrangers doivent être traduits par un traducteur assermenté et légalisés/apostillés selon les conventions internationales.
            </p>
          </div>
        </section>

        <section id="procedure-complete">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Procédure étape par étape</h2>
          
          <div className="relative">
            <div className="space-y-8">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Vérification de l'éligibilité</h3>
                  <p className="text-gray-600">Assurez-vous de remplir toutes les conditions requises avant de commencer la procédure. Calculez précisément votre durée de résidence.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-800 mb-2">Préparation du dossier</h3>
                  <p className="text-gray-600">Rassemblez tous les documents requis, faites vérifier par un professionnel si nécessaire. Organisez-les par catégories.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div class="pb-8">
                  <h3 class="font-bold text-gray-800 mb-2">Obtention du RDV préfecture</h3>
                  <p class="text-gray-600">Réservez un RDV via le site officiel ou utilisez un service de surveillance automatique pour les créneaux disponibles.</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex flex-col items-center mr-4">
                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <div class="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div class="pb-8">
                  <h3 class="font-bold text-gray-800 mb-2">Dépôt du dossier</h3>
                  <p class="text-gray-600">Présentez-vous au RDV avec l'original et une copie de chaque document. Le dépôt prend généralement 1 à 2 heures.</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex flex-col items-center mr-4">
                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">5</div>
                  <div class="w-0.5 h-full bg-gray-300 mt-2"></div>
                </div>
                <div class="pb-8">
                  <h3 class="font-bold text-gray-800 mb-2">Instruction du dossier</h3>
                  <p class="text-gray-600">La préfecture instruit votre dossier (6-18 mois). Vous pouvez suivre l'avancement avec votre numéro de dossier.</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex flex-col items-center mr-4">
                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">6</div>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800 mb-2">Convocation pour cérémonie</h3>
                  <p class="text-gray-600">Si acceptée, vous êtes convoqué pour la cérémonie de naturalisation. Présence obligatoire avec pièce d'identité.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rdv-prefecture">
          <h2 class="text-2xl font-black text-gray-900 mb-4">Obtention du RDV préfecture naturalisation</h2>
          
          <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Plateformes officielles de réservation</h3>
          <div class="bg-gray-50 rounded-lg p-4 my-4">
            <h4 class="font-bold text-gray-800 mb-2">Sites de réservation officiels :</h4>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>RDV naturalisation :</strong> <a href="https://administration-etrangers-en-france.interieur.gouv.fr" class="text-primary hover:underline">administration-etrangers-en-france.interieur.gouv.fr</a></li>
              <li><strong>Service-public.fr :</strong> <a href="https://www.service-public.fr" class="text-primary hover:underline">service-public.fr</a> (point d'entrée général)</li>
              <li><strong>Préfecture en ligne :</strong> Selon votre département de résidence</li>
            </ul>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Stratégies pour obtenir un RDV rapidement</h3>
          <div class="space-y-4">
            <div class="border-l-4 border-green-500 pl-4">
              <h4 class="font-bold text-gray-800">⏰ Timing optimal</h4>
              <p class="text-gray-600">Lundi 8h30-9h30 et vendredi 15h30-16h30 (maximum d'annulations)</p>
            </div>
            
            <div class="border-l-4 border-green-500 pl-4">
              <h4 class="font-bold text-gray-800">📍 Multi-préfectures</h4>
              <p class="text-gray-600">Surveillez votre préfecture + 2-3 préfectures voisines dans un rayon de 100km</p>
            </div>
            
            <div class="border-l-4 border-green-500 pl-4">
              <h4 class="font-bold text-gray-800">🤖 Solution automatisée</h4>
              <p class="text-gray-600">RDVPriority surveille 24h/24 les RDV naturalisation et alerte dès disponibilité</p>
            </div>
          </div>

          <div class="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white my-6">
            <h4 class="font-bold text-lg mb-2">🚀 Solution RDVPriority pour naturalisation</h4>
            <p class="mb-3">Surveillance automatique des RDV naturalisation dans toutes les préfectures françaises. Alertes instantanées par email, SMS et Telegram dès qu'un créneau devient disponible.</p>
            <Link href="/register" class="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller les RDV naturalisation
            </Link>
          </div>
        </section>

        <section id="delais-couts">
          <h2 class="text-2xl font-black text-gray-900 mb-4">Délais de traitement et coûts</h2>
          
          <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Délais moyens de traitement (2024)</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="py-3 px-4 text-left font-bold text-gray-900">Situation</th>
                  <th class="py-3 px-4 text-left font-bold text-gray-900">Délai moyen</th>
                  <th class="py-3 px-4 text-left font-bold text-gray-900">Taux d'acceptation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr>
                  <td class="py-3 px-4 font-medium">Résidence 5 ans</td>
                  <td class="py-3 px-4">12-18 mois</td>
                  <td class="py-3 px-4">75%</td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="py-3 px-4 font-medium">Mariage Français</td>
                  <td class="py-3 px-4">8-12 mois</td>
                  <td class="py-3 px-4">82%</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium">Diplômé université</td>
                  <td class="py-3 px-4">6-10 mois</td>
                  <td class="py-3 px-4">88%</td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="py-3 px-4 font-medium">Services exceptionnels</td>
                  <td class="py-3 px-4">3-6 mois</td>
                  <td class="py-3 px-4">95%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mt-8 mb-3">Coûts associés</h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl p-6 border shadow-sm">
              <h4 class="font-bold text-gray-800 mb-3">Coûts obligatoires</h4>
              <ul class="space-y-2">
                <li><strong>Timbre fiscal :</strong> €55</li>
                <li><strong>Traductions assermentées :</strong> €50-150</li>
                <li><strong>Frais de déplacement :</strong> Variable</li>
              </ul>
            </div>
            
            <div class="bg-white rounded-xl p-6 border shadow-sm">
              <h4 class="font-bold text-gray-800 mb-3">Coûts facultatifs</h4>
              <ul class="space-y-2">
                <li><strong>Conseil juridique :</strong> €300-1500</li>
                <li><strong>Accompagnement :</strong> €200-800</li>
                <li><strong>Service de surveillance :</strong> €4,99-29,99/mois</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="erreurs-eviter">
          <h2 class="text-2xl font-black text-gray-900 mb-4">Erreurs fréquentes à éviter absolument</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 class="font-bold text-red-800 mb-2">❌ Calcul erroné de la durée de résidence</h3>
              <p class="text-red-700 text-sm">Oublier les absences supérieures à 3 mois ou les séjours à l'étranger non autorisés</p>
            </div>
            
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 class="font-bold text-red-800 mb-2">❌ Documents incomplets ou périmés</h3>
              <p class="text-red-700 text-sm">Manquer de pièces justificatives ou utiliser des documents expirés</p>
            </div>
            
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 class="font-bold text-red-800 mb-2">❌ Absence de RDV</h3>
              <p class="text-red-700 text-sm">Se présenter sans rendez-vous dans les préfectures exigeantes</p>
            </div>
            
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 class="font-bold text-red-800 mb-2">❌ Traductions non conformes</h3>
              <p class="text-red-700 text-sm">Utiliser des traducteurs non assermentés ou oublier l'apostille</p>
            </div>
          </div>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <h3 class="font-bold text-yellow-800 mb-2">⚠️ Conseils de prospection :</h3>
            <ul class="list-disc pl-5 space-y-1 text-yellow-700">
              <li>Faites vérifier votre dossier par un avocat spécialisé avant dépôt</li>
              <li>Gardez des copies de tous les documents déposés</li>
              <li>Notez précisément le numéro de dossier et mot de passe</li>
              <li>Activez les alertes pour suivre l'avancement de votre demande</li>
            </ul>
          </div>
        </section>

        {/* FAQ Section */}
        <section class="bg-gray-50 rounded-xl p-6 mt-12">
          <h2 class="text-2xl font-black text-gray-900 mb-6">Questions fréquentes sur la naturalisation</h2>
          
          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-gray-800">Puis-je conserver ma nationalité d'origine ?</h3>
              <p class="text-gray-600">Oui, la France autorise la double nationalité. Vérifiez les lois de votre pays d'origine car certaines ne le permettent pas.</p>
            </div>
            
            <div>
              <h3 class="font-bold text-gray-800">Quels sont les motifs de refus les plus fréquents ?</h3>
              <p class="text-gray-600">Casier judiciaire, faux documents, durée de résidence insuffisante, manque de maîtrise du français, activités contraires aux valeurs républicaines.</p>
            </div>
            
            <div>
              <h3 class="font-bold text-gray-800">Puis-je voyager à l'étranger pendant l'instruction ?</h3>
              <p class="text-gray-600">Oui, mais évitez les absences prolongées. Informez la préfecture de vos déplacements si nécessaire.</p>
            </div>
            
            <div>
              <h3 class="font-bold text-gray-800">Que faire si ma demande est refusée ?</h3>
              <p class="text-gray-600">Vous pouvez introduire un recours gracieux auprès de la préfecture ou un recours contentieux devant le tribunal administratif.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section class="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-center text-white mt-12">
          <h2 class="text-2xl font-black mb-3">Ne perdez pas des mois précieux</h2>
          <p class="mb-6 max-w-2xl mx-auto">
            Laissez RDVPriority surveiller les RDV naturalisation 24h/24. 
            Recevez une alerte instantanée dès qu'un créneau se libère dans votre département.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" class="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Surveiller les RDV naturalisation
            </Link>
            <Link href="/#tarifs" class="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              Voir les tarifs
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
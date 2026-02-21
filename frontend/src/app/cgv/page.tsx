import Link from "next/link";

export default function CGVPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="tricolor-bar w-full" />
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span><span className="text-gray-400 text-sm">.fr</span></Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-primary">← Retour à l&apos;accueil</Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Conditions Générales de Vente</h1>
                <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 16 février 2026</p>

                <div className="prose prose-gray prose-sm max-w-none space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 1 — Objet du service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            RDVPriority.fr (ci-après « le Service ») est un <strong>outil générique de détection de changements sur des pages web publiquement accessibles</strong>. Le Service surveille automatiquement des pages web configurées par l&apos;Utilisateur et envoie des notifications lorsqu&apos;un changement est détecté sur ces pages.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Le Service fonctionne de manière identique à un rafraîchissement manuel de page web par l&apos;Utilisateur, mais de manière automatisée et à intervalles réguliers. Le Service ne modifie, n&apos;altère ni n&apos;interfère avec le fonctionnement des sites web surveillés.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 2 — Nature du Service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Le Service est un <strong>outil technique de surveillance de pages web</strong>, comparable à des services tels que Visualping, Distill.io ou ChangeTower. L&apos;Utilisateur est seul responsable du choix des pages web qu&apos;il configure pour la surveillance.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            RDVPriority.fr <strong>n&apos;est affilié à aucune administration publique, gouvernementale ou préfectorale</strong>. Le Service ne garantit ni la disponibilité, ni l&apos;exactitude, ni l&apos;exhaustivité des informations détectées sur les sites tiers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 3 — Formules et tarification</h2>
                        <p className="text-gray-600 leading-relaxed">Le Service propose les formules suivantes :</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li><strong>Urgence 24h (4,99€)</strong> — Paiement unique. Surveillance d&apos;une page pendant 24 heures. 1 alerte active, vérification toutes les 2 minutes, notification par email. <span className="text-red-600 font-bold">⚠️ Pas de remboursement</span></li>
                            <li><strong>Urgence 7 jours (14,99€)</strong> — Paiement unique. Surveillance pendant 7 jours. 3 alertes actives, vérification toutes les 60 secondes, notifications par email et Telegram. <span className="text-yellow-600 font-bold">🟡 Remboursement 50% si échec</span></li>
                            <li><strong>Urgence Totale (29,99€/mois)</strong> — Abonnement mensuel. Alertes illimitées, vérification toutes les 30 secondes, notifications par email, Telegram et SMS, service de conciergerie. <span className="text-green-600 font-bold">✅ Garantie "RDV ou remboursé"</span></li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Les prix sont indiqués en euros (€), toutes taxes comprises (TTC). Le prestataire se réserve le droit de modifier ses tarifs à tout moment. Les modifications ne s&apos;appliquent pas aux commandes déjà validées.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 4 — Paiement</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Le paiement s&apos;effectue en ligne via la plateforme sécurisée <strong>Stripe</strong>. Les moyens de paiement acceptés sont : carte bancaire (Visa, Mastercard, American Express). Le paiement est exigible immédiatement à la souscription.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 5 — Politique de remboursement par formule</h2>
                        
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <h3 className="font-bold text-red-800 mb-2">🚨 Urgence 24h (4,99€) — PAS DE REMBOURSEMENT</h3>
                            <p className="text-red-700 text-sm">
                                Cette formule est vendue telle quelle. Aucun remboursement ne sera effectué même si aucun créneau n&apos;est détecté. Le service est considéré comme rendu dès activation.
                            </p>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                            <h3 className="font-bold text-yellow-800 mb-2">⏰ Urgence 7 jours (14,99€) — REMBOURSEMENT PARTIEL</h3>
                            <p className="text-yellow-700 text-sm">
                                Remboursement de 50% si aucun créneau n&apos;est détecté pendant les 7 jours. Demande à effectuer par email dans les 7 jours suivant l&apos;expiration.
                            </p>
                        </div>
                        
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                            <h3 className="font-bold text-green-800 mb-2">✅ Urgence Totale (29,99€/mois) — GARANTIE COMPLÈTE</h3>
                            <p className="text-green-700 text-sm">
                                <strong>Garantie "Rendez-vous ou remboursé"</strong> : Remboursement intégral si aucun créneau de rendez-vous n&apos;est trouvé pendant la période de souscription. Remboursement automatique si applicable.
                            </p>
                        </div>
                        
                        <p className="text-gray-600 leading-relaxed mt-4">
                            <strong>Conditions générales de remboursement :</strong> Ces garanties ne s&apos;appliquent pas en cas de mauvaise configuration par l&apos;Utilisateur, de fermeture/indisponibilité du site web surveillé, ou d&apos;utilisation frauduleuse du service.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Les demandes de remboursement doivent être envoyées à <strong>support@rdvpriority.fr</strong> avec les détails de commande et la raison du remboursement demandé.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 6 — Droit de rétractation</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture d&apos;un contenu numérique non fourni sur un support matériel dont l&apos;exécution a commencé avec l&apos;accord du consommateur.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            En souscrivant au Service, l&apos;Utilisateur reconnaît et accepte que la surveillance commence immédiatement après le paiement, et renonce expressément à son droit de rétractation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 7 — Résiliation</h2>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Plans à paiement unique (24h, 7 jours) :</strong> Le Service prend fin automatiquement à l&apos;expiration de la période souscrite. Aucune résiliation nécessaire.</li>
                            <li><strong>Plan mensuel (Urgence Totale) :</strong> L&apos;Utilisateur peut résilier à tout moment depuis son espace client ou par email à support@rdvpriority.fr. La résiliation prend effet à la fin de la période de facturation en cours.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 8 — Responsabilité de l&apos;Utilisateur</h2>
                        <p className="text-gray-600 leading-relaxed">
                            L&apos;Utilisateur est <strong>seul responsable</strong> de la configuration de ses alertes et du choix des pages web à surveiller. L&apos;Utilisateur s&apos;engage à n&apos;utiliser le Service que pour surveiller des pages web <strong>publiquement accessibles</strong> et à respecter les conditions d&apos;utilisation des sites tiers surveillés.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            RDVPriority.fr décline toute responsabilité quant à l&apos;utilisation faite par l&apos;Utilisateur des informations obtenues via le Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 9 — Limitation de responsabilité</h2>
                        <p className="text-gray-600 leading-relaxed">
                            RDVPriority.fr ne saurait être tenu responsable en cas de :
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li>Indisponibilité temporaire ou permanente des sites web tiers surveillés</li>
                            <li>Modifications de structure des sites web tiers rendant la détection impossible</li>
                            <li>Retard dans l&apos;envoi des notifications dû à des facteurs techniques indépendants</li>
                            <li>Utilisation inappropriée du Service par l&apos;Utilisateur</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            La responsabilité de RDVPriority.fr est limitée au montant payé par l&apos;Utilisateur pour la période en cours.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 10 — Propriété intellectuelle</h2>
                        <p className="text-gray-600 leading-relaxed">
                            L&apos;ensemble des éléments du Service (textes, graphismes, logiciels, code source, bases de données, marques, logos) sont la propriété exclusive de RDVPriority.fr et sont protégés par le droit de la propriété intellectuelle.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 11 — Droit applicable et litiges</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Les présentes CGV sont soumises au droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, les tribunaux compétents seront ceux du ressort du siège social de l&apos;éditeur.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Conformément aux dispositions du Code de la consommation, le consommateur peut recourir à une médiation conventionnelle ou à tout mode alternatif de règlement des différends.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Article 12 — Contact</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Pour toute question relative aux présentes CGV, contactez-nous :<br />
                            <strong>Email :</strong> support@rdvpriority.fr<br />
                            <strong>Telegram :</strong> @rdvpriority
                        </p>
                    </section>

                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white py-6">
                <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 text-xs text-gray-400">
                    <Link href="/cgv" className="text-primary font-semibold">CGV</Link>
                    <Link href="/confidentialite" className="hover:text-gray-600">Politique de confidentialité</Link>
                    <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
                </div>
            </footer>
        </div>
    );
}

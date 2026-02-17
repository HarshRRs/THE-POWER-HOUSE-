import Link from "next/link";

export default function ConfidentialitePage() {
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
                <h1 className="text-3xl font-black text-gray-900 mb-2">Politique de Confidentialité</h1>
                <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 16 février 2026 — Conforme au RGPD (Règlement UE 2016/679)</p>

                <div className="prose prose-gray prose-sm max-w-none space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Le responsable du traitement des données personnelles est :<br />
                            <strong>RDVPriority.fr</strong><br />
                            Email : support@rdvpriority.fr<br />
                            Le responsable du traitement détermine les finalités et les moyens du traitement des données personnelles.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
                        <p className="text-gray-600 leading-relaxed">Nous collectons les données suivantes :</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li><strong>Données d&apos;identification :</strong> adresse email, mot de passe (hashé et salé via bcrypt)</li>
                            <li><strong>Données de contact :</strong> numéro de téléphone (optionnel, pour les alertes SMS), identifiant Telegram (optionnel)</li>
                            <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe. Nous ne stockons jamais vos données bancaires sur nos serveurs.</li>
                            <li><strong>Données d&apos;utilisation :</strong> pages web configurées pour la surveillance, historique des alertes, préférences de notification</li>
                            <li><strong>Données techniques :</strong> adresse IP, type de navigateur, système d&apos;exploitation (collectés automatiquement lors de la connexion)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
                        <p className="text-gray-600 leading-relaxed">Vos données sont traitées pour les finalités suivantes :</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li><strong>Exécution du contrat (Art. 6.1.b RGPD) :</strong> Création et gestion de votre compte, fourniture du service de surveillance, envoi des notifications d&apos;alerte</li>
                            <li><strong>Intérêt légitime (Art. 6.1.f RGPD) :</strong> Amélioration du service, prévention de la fraude, statistiques d&apos;utilisation anonymisées</li>
                            <li><strong>Obligation légale (Art. 6.1.c RGPD) :</strong> Conservation des données de facturation (conformément au droit fiscal français)</li>
                            <li><strong>Consentement (Art. 6.1.a RGPD) :</strong> Envoi de communications marketing (uniquement avec votre accord explicite)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Durée de conservation</h2>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Données de compte :</strong> conservées pendant la durée de votre inscription, puis supprimées dans les 30 jours suivant la suppression de votre compte</li>
                            <li><strong>Données de facturation :</strong> conservées 10 ans conformément aux obligations comptables françaises</li>
                            <li><strong>Données techniques (logs) :</strong> conservées 12 mois maximum</li>
                            <li><strong>Données de surveillance :</strong> supprimées automatiquement 30 jours après l&apos;expiration de votre plan</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Partage des données</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Vos données personnelles ne sont <strong>jamais vendues</strong>. Elles peuvent être partagées avec :
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li><strong>Stripe Inc.</strong> — Traitement des paiements (certifié PCI DSS niveau 1)</li>
                            <li><strong>Hébergeur</strong> — Stockage sécurisé des données (serveurs situés dans l&apos;Union Européenne)</li>
                            <li><strong>Services de notification</strong> — Envoi d&apos;emails, SMS et messages Telegram (uniquement les données nécessaires à la livraison du message)</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Aucun transfert de données hors de l&apos;Espace Économique Européen (EEE) n&apos;est effectué sans garanties appropriées conformément au RGPD.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Vos droits (Articles 15 à 22 du RGPD)</h2>
                        <p className="text-gray-600 leading-relaxed">Vous disposez des droits suivants :</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li><strong>Droit d&apos;accès :</strong> Obtenir une copie de vos données personnelles</li>
                            <li><strong>Droit de rectification :</strong> Modifier vos données inexactes ou incomplètes</li>
                            <li><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données (« droit à l&apos;oubli »)</li>
                            <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré et lisible</li>
                            <li><strong>Droit d&apos;opposition :</strong> Vous opposer au traitement de vos données</li>
                            <li><strong>Droit à la limitation :</strong> Demander la suspension du traitement</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Pour exercer vos droits, envoyez un email à <strong>support@rdvpriority.fr</strong> avec l&apos;objet « Exercice de droits RGPD ». Nous répondrons dans un délai de <strong>30 jours</strong>.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Vous avez également le droit d&apos;introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) — <a href="https://www.cnil.fr" className="text-primary underline">www.cnil.fr</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Sécurité des données</h2>
                        <p className="text-gray-600 leading-relaxed">Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                            <li>Chiffrement des communications (TLS/SSL)</li>
                            <li>Mots de passe hashés via bcrypt avec salage individuel</li>
                            <li>Paiements traités par Stripe (certifié PCI DSS)</li>
                            <li>Accès aux données limité au personnel strictement nécessaire</li>
                            <li>Sauvegardes chiffrées régulières</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Le Service utilise uniquement des <strong>cookies strictement nécessaires</strong> au fonctionnement du service (authentification, session). Aucun cookie de traçage publicitaire n&apos;est utilisé.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modifications</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Nous nous réservons le droit de modifier cette politique à tout moment. Les utilisateurs seront informés de toute modification substantielle par email au moins 15 jours avant l&apos;entrée en vigueur des nouvelles conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Pour toute question relative à la protection de vos données :<br />
                            <strong>Email :</strong> support@rdvpriority.fr<br />
                            <strong>Objet :</strong> « Protection des données »
                        </p>
                    </section>

                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white py-6">
                <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 text-xs text-gray-400">
                    <Link href="/cgv" className="hover:text-gray-600">CGV</Link>
                    <Link href="/confidentialite" className="text-primary font-semibold">Politique de confidentialité</Link>
                    <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
                </div>
            </footer>
        </div>
    );
}

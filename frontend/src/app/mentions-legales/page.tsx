import Link from "next/link";

export default function MentionsLegalesPage() {
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
                <h1 className="text-3xl font-black text-gray-900 mb-2">Mentions Légales</h1>
                <p className="text-sm text-gray-400 mb-10">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN)</p>

                <div className="prose prose-gray prose-sm max-w-none space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Éditeur du site</h2>
                        <div className="bg-white rounded-xl p-6 card-govt">
                            <ul className="space-y-2 text-gray-600">
                                <li><strong>Nom du site :</strong> RDVPriority.fr</li>
                                <li><strong>URL :</strong> https://rdvpriority.fr</li>
                                <li><strong>Statut :</strong> Micro-entreprise / Auto-entrepreneur</li>
                                <li><strong>SIRET :</strong> <span className="text-gray-400 italic">[À compléter lors de l&apos;immatriculation]</span></li>
                                <li><strong>Numéro TVA :</strong> <span className="text-gray-400 italic">[Non applicable — régime micro-entreprise]</span></li>
                                <li><strong>Responsable de la publication :</strong> <span className="text-gray-400 italic">[Votre nom complet]</span></li>
                                <li><strong>Email :</strong> support@rdvpriority.fr</li>
                            </ul>
                        </div>
                        <p className="text-xs text-accent mt-3 font-semibold">⚠️ Les champs entre crochets doivent être complétés avant la mise en ligne.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Hébergeur</h2>
                        <div className="bg-white rounded-xl p-6 card-govt">
                            <ul className="space-y-2 text-gray-600">
                                <li><strong>Nom :</strong> Vercel Inc.</li>
                                <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                                <li><strong>Site web :</strong> <a href="https://vercel.com" className="text-primary underline">https://vercel.com</a></li>
                            </ul>
                        </div>
                        <p className="text-gray-600 leading-relaxed mt-3 text-sm">
                            Note : Bien que l&apos;hébergeur soit situé aux États-Unis, Vercel Inc. respecte les clauses contractuelles types de la Commission européenne pour le transfert de données hors de l&apos;EEE.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Nature du service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            RDVPriority.fr est un <strong>service de détection automatique de changements sur des pages web publiquement accessibles</strong>. Le Service surveille des pages web choisies et configurées par l&apos;Utilisateur, et envoie des notifications lorsqu&apos;un changement est détecté.
                        </p>
                        <div className="bg-primary-light rounded-xl p-5 mt-4 border border-primary/10">
                            <p className="text-sm text-primary font-bold mb-2">📋 Déclaration de conformité</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Ce service n&apos;est <strong>affilié à aucune administration publique française</strong>, y compris les préfectures ou tout autre organisme gouvernemental. Le Service ne prétend représenter, remplacer ou se substituer à un service public.
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed mt-2">
                                Le Service fonctionne de manière identique aux outils de monitoring de pages web couramment utilisés (Visualping, Distill.io, ChangeTower, Sken.io), en vérifiant des pages web publiques et en notifiant l&apos;utilisateur des changements détectés.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Propriété intellectuelle</h2>
                        <p className="text-gray-600 leading-relaxed">
                            L&apos;ensemble du contenu du site (textes, graphismes, logos, icônes, images, clips audio et vidéo, logiciels, bases de données) est la propriété exclusive de l&apos;éditeur ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie du contenu du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de l&apos;éditeur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Protection des données personnelles</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi n° 78-17 du 6 janvier 1978 relative à l&apos;informatique, aux fichiers et aux libertés (loi Informatique et Libertés), l&apos;Utilisateur dispose de droits sur ses données personnelles.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            Pour plus d&apos;informations, consultez notre <Link href="/confidentialite" className="text-primary underline font-semibold">Politique de Confidentialité</Link>.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            <strong>Autorité de contrôle :</strong> CNIL — Commission Nationale de l&apos;Informatique et des Libertés<br />
                            3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
                            <a href="https://www.cnil.fr" className="text-primary underline">www.cnil.fr</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Le site utilise uniquement des cookies strictement nécessaires au fonctionnement du service (cookies de session et d&apos;authentification). Aucun cookie publicitaire ou de traçage n&apos;est déposé.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Médiation et litiges</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, le Service propose un dispositif de médiation de la consommation. Le consommateur peut recourir gratuitement au service de médiation proposé.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            En cas de litige non résolu, le consommateur peut également déposer sa réclamation sur la plateforme européenne de résolution en ligne des litiges :{" "}
                            <a href="https://ec.europa.eu/consumers/odr" className="text-primary underline">https://ec.europa.eu/consumers/odr</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">8. Crédits</h2>
                        <p className="text-gray-600 leading-relaxed">
                            <strong>Conception et développement :</strong> RDVPriority.fr<br />
                            <strong>Hébergement :</strong> Vercel Inc.
                        </p>
                    </section>

                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white py-6">
                <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 text-xs text-gray-400">
                    <Link href="/cgv" className="hover:text-gray-600">CGV</Link>
                    <Link href="/confidentialite" className="hover:text-gray-600">Politique de confidentialité</Link>
                    <Link href="/mentions-legales" className="text-primary font-semibold">Mentions légales</Link>
                </div>
            </footer>
        </div>
    );
}

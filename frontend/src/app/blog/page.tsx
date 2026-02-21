import Link from "next/link";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: number;
}

const blogPosts: BlogPost[] = [
  {
    slug: "comment-prendre-rdv-prefecture",
    title: "Comment prendre RDV préfecture en 2024 : Guide complet",
    excerpt: "Le guide ultime pour réussir votre prise de RDV préfecture. Découvrez les méthodes efficaces, les astuces pour éviter les files d'attente, et comment obtenir votre créneau en moins de 48h.",
    date: "2024-02-20",
    category: "Guides",
    readTime: 8
  },
  {
    slug: "prefecture-paris-horaires-services",
    title: "Préfecture de Paris : Horaires, services et contacts essentiels",
    excerpt: "Tout savoir sur la préfecture de Paris : horaires d'ouverture, services disponibles, numéros de téléphone, et conseils pour optimiser votre visite.",
    date: "2024-02-19",
    category: "Guides",
    readTime: 6
  },
  {
    slug: "titre-sejour-demarches-prefecture",
    title: "Titre de séjour : Démarches complètes à la préfecture",
    excerpt: "Guide étape par étape pour votre demande de titre de séjour. Documents requis, formulaires, délais, et erreurs à éviter absolument.",
    date: "2024-02-18",
    category: "Guides",
    readTime: 10
  },
  {
    slug: "attente-prefecture-statistiques",
    title: "Attente préfecture : Combien de temps ça prend vraiment ?",
    excerpt: "Analyse des temps d'attente réels dans les préfectures françaises. Statistiques par département, pics de fréquentation, et stratégies pour accélérer vos démarches.",
    date: "2024-02-17",
    category: "Analyses",
    readTime: 7
  },
  {
    slug: "prefecture-en-ligne-demarches-numeriques",
    title: "La préfecture en ligne : Révolution numérique des démarches administratives",
    excerpt: "Comment les services numériques transforment l'expérience usager. Guide des plateformes officielles, réservations en ligne, et futurs développements.",
    date: "2024-02-16",
    category: "Technologie",
    readTime: 6
  },
  {
    slug: "prefectures-regionales-comparatif",
    title: "Préfectures Lyon, Marseille, Bordeaux : Guide comparatif 2024",
    excerpt: "Comparatif détaillé des préfectures majeures de province. Services, efficacité, temps d'attente, et stratégies pour choisir la meilleure option.",
    date: "2024-02-15",
    category: "Guides",
    readTime: 8
  },
  {
    slug: "naturalisation-francaise-prefecture",
    title: "Naturalisation française : RDV préfecture étape par étape 2024",
    excerpt: "Guide complet pour votre demande de naturalisation française. Procédure détaillée, documents requis, délais, et stratégies pour obtenir votre RDV.",
    date: "2024-02-14",
    category: "Guides",
    readTime: 9
  },
  {
    slug: "carte-grise-prefecture-demarches",
    title: "Carte grise préfecture : Démarches complètes 2024",
    excerpt: "Guide étape par étape pour l'immatriculation de votre véhicule. Procédure carte grise, documents requis, coûts, et solutions pour éviter les files d'attente.",
    date: "2024-02-13",
    category: "Guides",
    readTime: 7
  },
  {
    slug: "erreur-prefecture-reservation-annulation",
    title: "Erreur préfecture réservation annulation : Comment récupérer rapidement ?",
    excerpt: "Guide complet pour gérer les erreurs de réservation préfecture, les annulations de RDV, et les solutions pour récupérer votre créneau perdu sans attendre.",
    date: "2024-02-12",
    category: "Guides",
    readTime: 6
  },
  {
    slug: "services-prefecture-alternatifs-2024",
    title: "Services préfecture alternatives 2024 : Évitez les files d'attente",
    excerpt: "Découvrez les meilleures alternatives aux services traditionnels de préfecture. Solutions digitales, services privés, et innovations technologiques.",
    date: "2024-02-11",
    category: "Technologie",
    readTime: 8
  }
];

export default function BlogPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Blog RDVPriority
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Guides, actualités et conseils pour réussir vos démarches préfecture. 
          Restez informé des dernières nouveautés et optimisez vos prises de RDV.
        </p>
      </section>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/blog/categories/guides" className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          Guides pratiques
        </Link>
        <Link href="/blog/categories/actualites" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
          Actualités
        </Link>
        <Link href="/blog/categories/analyses" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
          Analyses
        </Link>
        <Link href="/blog/categories/technologie" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
          Technologie
        </Link>
      </div>

      {/* Featured Post */}
      <section className="bg-white rounded-2xl card-shadow p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="bg-gradient-to-br from-primary to-accent h-48 md:h-full rounded-xl flex items-center justify-center text-white font-black text-4xl">
              RDV
            </div>
          </div>
          <div className="md:w-2/3">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3">
              Article vedette
            </span>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              <Link href="/blog/comment-prendre-rdv-prefecture" className="hover:text-primary transition-colors">
                Comment prendre RDV préfecture en 2024 : Guide complet
              </Link>
            </h2>
            <p className="text-gray-600 mb-4">
              Le guide ultime pour réussir votre prise de RDV préfecture. Découvrez les méthodes efficaces, les astuces pour éviter les files d'attente, et comment obtenir votre créneau en moins de 48h.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>20 février 2024</span>
              <span>•</span>
              <span>Lecture : 8 min</span>
              <span>•</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">Guides</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Tous les articles</h2>
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <article key={post.slug} className="bg-white rounded-xl card-shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
                  <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center text-gray-400 font-medium">
                    Image
                  </div>
                </div>
                <div className="md:w-3/4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {post.category}
                    </span>
                    <span className="text-gray-400 text-sm">{post.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Lecture : {post.readTime} min</span>
                    <span>•</span>
                    <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline">
                      Lire l'article →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-black mb-2">Restez informé</h3>
        <p className="mb-4 opacity-90">
          Recevez nos meilleurs conseils et actualités directement dans votre boîte mail
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Votre email" 
            className="flex-1 px-4 py-3 rounded-lg text-gray-900"
          />
          <button className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
            S'abonner
          </button>
        </div>
      </section>
    </div>
  );
}
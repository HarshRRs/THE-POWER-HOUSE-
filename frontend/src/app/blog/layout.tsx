import Link from "next/link";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="tricolor-bar w-full" />
      
      {/* Blog Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-extrabold text-primary">
              RDV<span className="text-accent">Priority</span>
              <span className="text-gray-400 text-sm">.fr</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-primary">
                Articles
              </Link>
              <Link href="/blog/categories/guides" className="text-sm font-medium text-gray-600 hover:text-primary">
                Guides
              </Link>
              <Link href="/blog/categories/actualites" className="text-sm font-medium text-gray-600 hover:text-primary">
                Actualités
              </Link>
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary">
                Accueil
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="text-lg font-extrabold text-primary">
            RDV<span className="text-accent">Priority</span>
            <span className="text-gray-400 text-sm">.fr</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Votre assistant pour les RDV préfecture en France
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
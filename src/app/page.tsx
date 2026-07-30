import { getDb } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatManifestoTitle(title: string) {
  const words = title.split(' ');
  
  if (words.length <= 1) {
    return (
      <h1 className="font-display text-display" style={{ textTransform: 'uppercase', lineHeight: 0.9 }}>
        <span className="bg-accent" style={{ padding: '0 0.2em' }}>{title}</span>
      </h1>
    );
  }

  // Split logic: grab the last 2 words if possible, else 1 word.
  // But if it's a very long title, maybe last 3 words?
  // 1 to 2 words looks best for the highlight block.
  const splitIndex = words.length >= 4 ? words.length - 2 : words.length - 1;
  const firstPart = words.slice(0, splitIndex).join(' ');
  const accentPart = words.slice(splitIndex).join(' ');

  return (
    <h1 className="font-display text-display" style={{ textTransform: 'uppercase', lineHeight: 0.9 }}>
      {firstPart} <br/>
      <span className="bg-accent" style={{ padding: '0 0.2em' }}>{accentPart}</span>
    </h1>
  );
}

export default async function Home() {
  const db = await getDb();
  
  // As 4 últimas notícias
  const articles = db.articles;
  
  const highlight = articles[0];
  const recents = articles.slice(1, 4);

  return (
    <main>
      <section className="container flex-col items-center" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <div className="manifesto-header">
          {highlight ? formatManifestoTitle(highlight.title) : (
            <h1 className="font-display text-display" style={{ textTransform: 'uppercase', lineHeight: 0.9 }}>
              NÃO PRECISAMOS <br/>
              <span className="bg-accent" style={{ padding: '0 0.2em' }}>LER TUDO.</span>
            </h1>
          )}
        </div>
        
        <div style={{ maxWidth: '60ch', margin: '0 auto var(--space-3xl) auto', textAlign: 'left', fontSize: 'var(--text-lg)', borderLeft: '4px solid var(--color-rule)', paddingLeft: 'var(--space-md)' }}>
          <p>{highlight ? highlight.description : 'Nós lemos a internet para você. Cole um link, e nosso jornalista de IA destila o ruído em clareza absoluta e brutal.'}</p>
        </div>

        {highlight && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <Link href={`/noticia/${highlight.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
              LER MATÉRIA COMPLETA
            </Link>
          </div>
        )}
      </section>

      <section className="manifesto-block flex-col items-center">
        <h2 className="font-display text-2xl" style={{ textTransform: 'uppercase', marginBottom: 'var(--space-xl)' }}>Últimas Extrações</h2>
        <div className="flex-row gap-lg" style={{ width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
          {recents.length > 0 ? recents.map((article) => (
            <article key={article.id} className="card" style={{ flex: '1 1 300px', background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
              <div className="font-label text-xs color-ink-2" style={{ marginBottom: 'var(--space-xs)' }}>AGORA MESMO</div>
              <h3 className="font-display text-xl" style={{ marginBottom: 'var(--space-md)' }}>{article.title}</h3>
              <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--space-xs)' }}>
                <Link href={`/noticia/${article.id}`} className="font-label text-xs color-accent" style={{ textDecoration: 'none' }}>
                  LER COMPLETO →
                </Link>
              </div>
            </article>
          )) : (
            <div style={{ color: 'var(--color-ink-2)' }}>Nenhuma extração recente encontrada.</div>
          )}
        </div>
      </section>
    </main>
  );
}
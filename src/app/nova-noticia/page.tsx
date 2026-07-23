"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaNoticia() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ message: string, existingId?: string } | null>(null);
  const router = useRouter();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      
      if (data.success && data.id) {
        router.push(`/noticia/${data.id}`);
      }
    } catch (err: any) {
      try {
        const errorData = JSON.parse(err.message);
        setErrorMsg({ message: errorData.error || 'Erro na extração', existingId: errorData.existingId });
      } catch {
        setErrorMsg({ message: err.message || 'Erro na extração' });
      }
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: 'var(--space-3xl) var(--space-md)' }}>
      <section className="container flex-col items-center" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <div className="manifesto-header">
          <h1 className="font-display text-display" style={{ textTransform: 'uppercase', lineHeight: 0.9 }}>
            ADICIONAR <br/>
            <span className="bg-accent" style={{ padding: '0 0.2em' }}>NOTÍCIA.</span>
          </h1>
        </div>
        
        <div style={{ maxWidth: '60ch', margin: '0 auto var(--space-3xl) auto', textAlign: 'left', fontSize: 'var(--text-lg)', borderLeft: '4px solid var(--color-rule)', paddingLeft: 'var(--space-md)' }}>
          <p>Cole um link e o sistema de IA fará a extração em formato Markdown, armazenando diretamente no banco de dados.</p>
        </div>

        <form onSubmit={handleExtract} className="flex-row gap-md" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <input
            type="url"
            className="input-field"
            placeholder="COLE A URL DO ARTIGO AQUI..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'PROCESSANDO...' : 'EXTRAIR E SALVAR'}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-md)', background: 'var(--color-ink)', color: 'var(--color-paper)', borderRadius: '4px', textAlign: 'center', width: '100%', maxWidth: '800px', margin: 'var(--space-xl) auto 0' }}>
            <p className="font-label" style={{ marginBottom: errorMsg.existingId ? 'var(--space-md)' : 0 }}>{errorMsg.message}</p>
            {errorMsg.existingId && (
              <button onClick={() => router.push(`/noticia/${errorMsg.existingId}`)} className="btn-primary" style={{ display: 'inline-block', background: 'var(--color-paper)', color: 'var(--color-ink)', fontSize: '0.8rem', padding: 'var(--space-xs) var(--space-sm)' }}>
                VER MATÉRIA CADASTRADA →
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

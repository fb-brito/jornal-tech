"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import { useRouter } from 'next/navigation';

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    if (ref.current && chart) {
      mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), chart)
        .then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        })
        .catch(e => {
          console.error("Mermaid error", e);
          if (ref.current) ref.current.innerHTML = `<pre>${chart}</pre><p style="color:var(--color-accent); font-size:var(--text-xs);">Erro ao renderizar diagrama</p>`;
        });
    }
  }, [chart]);
  return <div ref={ref} style={{ margin: 'var(--space-xl) 0', overflowX: 'auto', background: 'white', padding: 'var(--space-md)', borderRadius: '4px' }} />;
};

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return (
      <img 
        src={images[0]} 
        alt="Capa" 
        style={{ width: '100%', maxHeight: '50vh', objectFit: 'cover', marginBottom: 'var(--space-2xl)' }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxHeight: '50vh', marginBottom: 'var(--space-2xl)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <img 
        src={images[currentIndex]} 
        alt={`Imagem ${currentIndex + 1}`} 
        style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }}
      />
      
      <button 
        onClick={() => setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
      >
        ❮
      </button>
      
      <button 
        onClick={() => setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
      >
        ❯
      </button>

      <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
        {images.map((_, idx) => (
          <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
};

export default function ArticleContent({ article }: { article: any }) {
  const router = useRouter();
  
  return (
    <article className="container prose" style={{ padding: 'var(--space-3xl) var(--space-md)' }}>
      <button 
        onClick={() => router.back()}
        className="font-label text-xs"
        style={{ display: 'inline-block', background: 'transparent', border: '1px solid var(--color-rule)', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', marginBottom: 'var(--space-xl)', textDecoration: 'none', color: 'inherit' }}
      >
        ← RETORNAR
      </button>
      
      {article.images && article.images.length > 0 ? (
        <ImageCarousel images={article.images} />
      ) : article.coverImage ? (
        <img 
          src={article.coverImage} 
          alt="Capa" 
          style={{ width: '100%', maxHeight: '50vh', objectFit: 'cover', marginBottom: 'var(--space-2xl)' }}
        />
      ) : null}
      
      <ReactMarkdown
        components={{
          code({node, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            return <code className={className} {...props}>{children}</code>;
          },
          img({node, src, alt, ...props}: any) {
            if (src?.includes('pollinations.ai')) {
              return (
                <span style={{ 
                  display: 'block',
                  margin: 'var(--space-2xl) 0', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-rule)'
                }}>
                  <img 
                    src={src} 
                    alt={alt} 
                    style={{ 
                      width: '100%', 
                      aspectRatio: '16/9', 
                      objectFit: 'cover',
                      display: 'block',
                      margin: 0,
                      border: 'none'
                    }} 
                    {...props} 
                  />
                  <span style={{ 
                    display: 'block',
                    padding: 'var(--space-md)', 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--color-text-dim)', 
                    borderTop: '1px solid var(--color-rule)',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {alt}
                  </span>
                </span>
              );
            }
            return <img src={src} alt={alt} {...props} />;
          }
        }}
      >
        {article.markdown}
      </ReactMarkdown>

      {article.url && (
        <div style={{ marginTop: 'var(--space-3xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--color-rule)' }}>
          <p className="font-label text-sm">
            <strong>Fonte:</strong> <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>RedNote (Xiaohongshu)</a>
          </p>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'right' }}>
        <button 
          onClick={async () => {
            if (confirm('Deseja mover esta matéria para a lixeira?')) {
              const res = await fetch('/api/delete-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: article.id })
              });
              if (res.ok) {
                router.push('/nossas-noticias');
                router.refresh();
              } else {
                alert('Falha ao excluir matéria.');
              }
            }
          }}
          className="font-label text-xs"
          style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', borderRadius: '4px' }}
        >
          🗑️ EXCLUIR
        </button>
      </div>
    </article>
  );
}

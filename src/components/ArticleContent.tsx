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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
      
      {article.published_at && (
        <div style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text-dim)', fontSize: 'var(--text-sm)', fontWeight: 500, borderBottom: '1px solid var(--color-rule)', paddingBottom: 'var(--space-sm)' }}>
          Postado em: {new Date(article.published_at).toLocaleDateString('pt-BR')}
        </div>
      )}
      
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
          onClick={() => setIsModalOpen(true)}
          className="font-label text-xs"
          style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', borderRadius: '4px' }}
        >
          🗑️ EXCLUIR
        </button>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', padding: 'var(--space-2xl)', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--color-rule)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-md)', fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>Excluir Matéria</h3>
            <p style={{ color: 'var(--color-text-dim)', marginBottom: 'var(--space-2xl)' }}>Deseja realmente mover esta matéria para a lixeira?</p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-text)', padding: 'var(--space-sm) var(--space-xl)', cursor: 'pointer', borderRadius: '4px', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
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
                    setIsModalOpen(false);
                  }
                }} 
                style={{ background: '#ff4444', border: 'none', color: 'white', padding: 'var(--space-sm) var(--space-xl)', cursor: 'pointer', borderRadius: '4px', fontWeight: 600 }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

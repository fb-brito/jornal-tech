'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PaginationControls({ 
  currentPage, 
  totalPages 
}: { 
  currentPage: number; 
  totalPages: number;
}) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(currentPage.toString());

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = parseInt(inputValue, 10);
    if (isNaN(target)) target = 1;
    if (target > totalPages) target = totalPages;
    if (target < 1) target = 1;
    
    setInputValue(target.toString());
    router.push(`/nossas-noticias?page=${target}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apenas permite números
    const val = e.target.value.replace(/[^0-9]/g, '');
    let num = parseInt(val, 10);
    
    // Auto-corrige se for maior que o total de páginas, conforme solicitado
    if (num > totalPages) {
      num = totalPages;
    }
    
    setInputValue(num ? num.toString() : '');
  };

  const buttonStyle = { 
    padding: 'var(--space-xs) var(--space-md)', 
    background: 'transparent',
    border: '1px solid var(--color-rule)',
    color: 'var(--color-ink)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const disabledStyle = {
    ...buttonStyle,
    opacity: 0.3,
    cursor: 'not-allowed'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-2xl)' }}>
      {/* PRIMEIRA */}
      {currentPage > 1 ? (
        <Link href={`/nossas-noticias?page=1`} className="font-label text-xs" style={buttonStyle}>
          &lt;&lt; PRIMEIRA
        </Link>
      ) : (
        <span className="font-label text-xs" style={disabledStyle}>
          &lt;&lt; PRIMEIRA
        </span>
      )}

      {/* ANTERIOR */}
      {currentPage > 1 ? (
        <Link href={`/nossas-noticias?page=${currentPage - 1}`} className="font-label text-xs" style={buttonStyle}>
          &larr; ANTERIOR
        </Link>
      ) : (
        <span className="font-label text-xs" style={disabledStyle}>
          &larr; ANTERIOR
        </span>
      )}

      {/* INPUT */}
      <form onSubmit={handlePageSubmit} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <span className="font-label text-xs" style={{ color: 'var(--color-ink-2)' }}>PÁGINA</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => { if (!inputValue) setInputValue('1'); }}
          style={{ 
            width: '40px', 
            padding: 'var(--space-2xs)', 
            background: 'transparent', 
            color: 'var(--color-ink)', 
            border: '1px solid var(--color-rule)', 
            textAlign: 'center', 
            fontFamily: 'var(--font-mono, monospace)' 
          }} 
        />
        <span className="font-label text-xs" style={{ color: 'var(--color-ink-2)' }}>DE {totalPages}</span>
      </form>

      {/* PRÓXIMA */}
      {currentPage < totalPages ? (
        <Link href={`/nossas-noticias?page=${currentPage + 1}`} className="font-label text-xs" style={buttonStyle}>
          PRÓXIMA &rarr;
        </Link>
      ) : (
        <span className="font-label text-xs" style={disabledStyle}>
          PRÓXIMA &rarr;
        </span>
      )}

      {/* ÚLTIMA */}
      {currentPage < totalPages ? (
        <Link href={`/nossas-noticias?page=${totalPages}`} className="font-label text-xs" style={buttonStyle}>
          ÚLTIMA &gt;&gt;
        </Link>
      ) : (
        <span className="font-label text-xs" style={disabledStyle}>
          ÚLTIMA &gt;&gt;
        </span>
      )}
    </div>
  );
}

'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
    >
      開啟列印對話框 (另存為 PDF)
    </button>
  );
}

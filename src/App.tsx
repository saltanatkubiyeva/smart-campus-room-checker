import { useState } from 'react';
import RoomChecker from '@/components/RoomChecker';
import ContractChecker from '@/components/ContractChecker';

type Tab = 'catalog' | 'contract';

function App() {
  const [tab, setTab] = useState<Tab>('catalog');

  const tabClass = (active: boolean) =>
    [
      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      active ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200',
    ].join(' ');

  return (
    <div>
      <nav
        aria-label="Views"
        className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1">
          <button
            type="button"
            className={tabClass(tab === 'catalog')}
            aria-pressed={tab === 'catalog'}
            onClick={() => setTab('catalog')}
          >
            Room catalog
          </button>
          <button
            type="button"
            className={tabClass(tab === 'contract')}
            aria-pressed={tab === 'contract'}
            onClick={() => setTab('contract')}
          >
            Contract check (P13)
          </button>
        </div>
      </nav>

      {tab === 'catalog' ? <RoomChecker /> : (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <ContractChecker />
        </main>
      )}
    </div>
  );
}

export default App;

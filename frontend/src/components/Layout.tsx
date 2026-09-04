import type React from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { Footer } from '@/components/Footer';
import { NavBar } from '@/components/NavBar';
import { useContentStore } from '@/stores/contentStore';

interface PreviewMessage {
  type?: unknown;
  overrides?: unknown;
  scrollSelector?: unknown;
}

export function Layout(): React.ReactElement {
  const load = useContentStore((s) => s.load);

  // Applique les overrides éditoriaux par-dessus les textes par défaut.
  useEffect((): void => {
    void load();
  }, [load]);

  // Mode prévisualisation : quand le site est embarqué dans l'iframe de
  // l'admin « Contenu du site », il reçoit les brouillons par postMessage et
  // les applique en direct (même origine uniquement).
  useEffect((): (() => void) => {
    if (window.self === window.top) {
      return (): void => {};
    }
    function onMessage(event: MessageEvent): void {
      if (event.origin !== window.location.origin) return;
      const data = event.data as PreviewMessage | null;
      if (data === null || data.type !== 'climalia:content-preview') return;
      if (typeof data.overrides === 'object' && data.overrides !== null && !Array.isArray(data.overrides)) {
        useContentStore.getState().setOverrides(data.overrides as Record<string, string>);
      }
      if (typeof data.scrollSelector === 'string' && data.scrollSelector !== '') {
        document.querySelector(data.scrollSelector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    window.addEventListener('message', onMessage);
    return (): void => {
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

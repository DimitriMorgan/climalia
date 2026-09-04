import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { fetchContentOverrides, saveContentOverrides } from '@/api/content';
import { Icon } from '@/components/Icon';
import { ProShell } from '@/components/ProShell';
import {
  CONTENT_DEFAULTS,
  CONTENT_GROUP_LABELS,
  CONTENT_KEYS,
  contentGroupOf,
} from '@/content/defaults';
import type { ContentKey } from '@/content/defaults';
import { useContentStore } from '@/stores/contentStore';
import type { ContentOverrides } from '@/types/api';

/** Route du site public à afficher dans l'aperçu selon le groupe de clés édité. */
const PREVIEW_ROUTES: Readonly<Record<string, string>> = {
  home: '/',
  services: '/services',
  realizations: '/realisations',
  about: '/a-propos',
  contact: '/contact',
  footer: '/',
};

/** Ancre de scroll dans l'aperçu selon le préfixe de la clé en cours d'édition. */
const PREVIEW_ANCHORS: ReadonlyArray<{ prefix: string; selector: string }> = [
  { prefix: 'home.hero', selector: '.hero' },
  { prefix: 'home.services', selector: '.svc-preview' },
  { prefix: 'home.testimonials', selector: '.marquee-section' },
  { prefix: 'home.cta', selector: '.cta-section' },
  { prefix: 'footer', selector: '.footer' },
  { prefix: 'contact.phone', selector: '.contact-aside' },
  { prefix: 'contact.email', selector: '.contact-aside' },
];

function anchorFor(key: ContentKey | null): string {
  if (key === null) return '';
  for (const { prefix, selector } of PREVIEW_ANCHORS) {
    if (key.startsWith(prefix)) return selector;
  }
  return '';
}

/**
 * Administration des clés de contenu (« traductions ») du site vitrine.
 * Chaque clé affiche sa valeur effective ; modifier puis enregistrer crée un
 * override en base. « Réinitialiser » revient au texte par défaut du code.
 */
export function ContentAdminPage(): React.ReactElement {
  const setStoreOverrides = useContentStore((s) => s.setOverrides);

  const [overrides, setOverrides] = useState<ContentOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  // --- Aperçu live : iframe du site public pilotée par postMessage. ---
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [activeKey, setActiveKey] = useState<ContentKey | null>(null);
  const previewPath = PREVIEW_ROUTES[activeKey === null ? 'home' : contentGroupOf(activeKey)] ?? '/';

  function pushPreview(scrollSelector = ''): void {
    const target = iframeRef.current?.contentWindow;
    if (target == null) return;
    // Brouillons par-dessus les overrides enregistrés : ce que verra le site
    // une fois « Enregistrer » cliqué.
    // Un brouillon vide ou revenu au texte par defaut retire la cle, y compris
    // quand un override etait enregistre : c'est un retour au defaut.
    const merged: Record<string, string> = Object.fromEntries(
      Object.entries({ ...overrides, ...drafts }).filter(([key]) => {
        const draft = drafts[key];
        return (
          draft === undefined ||
          (draft.trim() !== '' && draft !== CONTENT_DEFAULTS[key as ContentKey])
        );
      }),
    );
    target.postMessage(
      { type: 'climalia:content-preview', overrides: merged, scrollSelector },
      window.location.origin,
    );
  }

  // Push à chaque frappe / changement de clé active (l'iframe applique en direct).
  useEffect((): void => {
    pushPreview(anchorFor(activeKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, overrides, activeKey]);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    fetchContentOverrides()
      .then((data) => {
        if (!state.cancelled) { setOverrides(data); setError(null); }
      })
      .catch((err: unknown) => {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      })
      .finally(() => { if (!state.cancelled) setLoading(false); });
    return (): void => { state.cancelled = true; };
  }, []);

  const effectiveValue = (key: ContentKey): string =>
    drafts[key] ?? overrides[key] ?? CONTENT_DEFAULTS[key];

  const isOverridden = (key: ContentKey): boolean => overrides[key] !== undefined;
  const isDirty = (key: ContentKey): boolean => {
    const draft = drafts[key];
    if (draft === undefined) return false;
    return draft !== (overrides[key] ?? CONTENT_DEFAULTS[key]);
  };

  const dirtyKeys = useMemo(
    () => CONTENT_KEYS.filter((key) => isDirty(key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drafts, overrides],
  );

  const groups = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const map = new Map<string, ContentKey[]>();
    for (const key of CONTENT_KEYS) {
      if (query !== '' && !key.toLowerCase().includes(query)
        && !CONTENT_DEFAULTS[key].toLowerCase().includes(query)) {
        continue;
      }
      const group = contentGroupOf(key);
      const list = map.get(group) ?? [];
      list.push(key);
      map.set(group, list);
    }
    return [...map.entries()];
  }, [filter]);

  function setDraft(key: ContentKey, value: string): void {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(): Promise<void> {
    if (dirtyKeys.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveContentOverrides(dirtyKeys.map((key) => {
        const value = drafts[key] ?? '';
        // Valeur identique au défaut → on supprime l'override plutôt que le dupliquer.
        return { key, value: value.trim() === '' || value === CONTENT_DEFAULTS[key] ? null : value };
      }));
      setOverrides(next);
      setStoreOverrides(next);
      setDrafts({});
      setSavedAt(Date.now());
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(key: ContentKey): Promise<void> {
    setError(null);
    try {
      const next = await saveContentOverrides([{ key, value: null }]);
      setOverrides(next);
      setStoreOverrides(next);
      setDrafts((prev) => {
        const rest = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete rest[key];
        return rest;
      });
      setSavedAt(Date.now());
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Réinitialisation impossible.');
    }
  }

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Gestion éditoriale</div>
            <h1 className="dash__banner-title">Contenu du site</h1>
            <p className="dash__banner-desc">
              Toutes les clés de texte du site vitrine. Modifiez une valeur puis enregistrez :
              le site public est mis à jour immédiatement. « Réinitialiser » revient au texte d&apos;origine.
            </p>
          </div>
          <div className="dash__banner-stats">
            <button
              type="button"
              className="btn btn--accent btn--lg"
              disabled={saving || dirtyKeys.length === 0}
              onClick={(): void => { void handleSave(); }}
            >
              {saving
                ? 'Enregistrement…'
                : dirtyKeys.length === 0
                  ? 'Aucune modification'
                  : `Enregistrer (${String(dirtyKeys.length)})`}
            </button>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          <div className="content-split">
            <div className="content-split__editor">
              <div className="card search-card">
                <div className="search-input">
                  <Icon name="search" size={16} />
                  <input
                    type="search"
                    placeholder="Filtrer les clés (ex. « hero », « devis », un mot du texte…)"
                    value={filter}
                    onChange={(e): void => { setFilter(e.target.value); }}
                  />
                </div>
                <span className="search-card__count" style={{ whiteSpace: 'nowrap' }}>
                  Astuce : *texte* = accent couleur
                </span>
              </div>

              {error !== null ? <p role="alert" className="alert alert--bad">{error}</p> : null}
              {savedAt !== null && dirtyKeys.length === 0 && error === null ? (
                <p className="alert alert--ok">Modifications enregistrées — le site public est à jour.</p>
              ) : null}

              {loading ? (
                <p className="empty-state">Chargement…</p>
              ) : (
                groups.map(([group, keys]) => (
                  <section key={group} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
                      {CONTENT_GROUP_LABELS[group] ?? group}
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {keys.map((key) => {
                        const value = effectiveValue(key);
                        const rows = Math.min(4, Math.max(1, Math.ceil(value.length / 70) + value.split('\n').length - 1));
                        return (
                          <div key={key} className={`content-key ${activeKey === key ? 'is-active' : ''}`}>
                            <div className="content-key__head">
                              <code className="content-key__name">{key}</code>
                              {isDirty(key) ? (
                                <span className="tag" style={{ color: 'var(--accent-deep)' }}>Non enregistré</span>
                              ) : isOverridden(key) ? (
                                <span className="tag">Modifié</span>
                              ) : null}
                              {isOverridden(key) || isDirty(key) ? (
                                <button
                                  type="button"
                                  className="content-key__reset"
                                  onClick={(): void => { void handleReset(key); }}
                                  title="Revenir au texte par défaut"
                                >
                                  Réinitialiser
                                </button>
                              ) : null}
                            </div>
                            <textarea
                              className="field"
                              rows={rows}
                              value={value}
                              aria-label={`Valeur de la clé ${key}`}
                              onFocus={(): void => { setActiveKey(key); }}
                              onChange={(e): void => { setDraft(key, e.target.value); }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <aside className="content-split__preview" aria-label="Aperçu du site">
              <div className="content-preview card">
                <div className="content-preview__head">
                  <span className="content-preview__label">
                    Aperçu — {CONTENT_GROUP_LABELS[activeKey === null ? 'home' : contentGroupOf(activeKey)] ?? 'Accueil'}
                  </span>
                  <a
                    href={previewPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--sm"
                  >
                    Ouvrir <Icon name="arrow-up-right" size={13} />
                  </a>
                </div>
                <div className="content-preview__frame">
                  <iframe
                    ref={iframeRef}
                    src={previewPath}
                    title="Aperçu du site public"
                    onLoad={(): void => { pushPreview(anchorFor(activeKey)); }}
                  />
                </div>
                <p className="content-preview__hint">
                  L&apos;aperçu reflète vos modifications en direct, avant enregistrement.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ProShell>
  );
}

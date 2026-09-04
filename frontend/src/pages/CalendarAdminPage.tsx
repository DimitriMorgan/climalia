import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { listDocuments } from '@/api/documents';
import { Icon } from '@/components/Icon';
import { ProShell } from '@/components/ProShell';
import { DocumentPreviewModal } from '@/features/documents/DocumentPreviewModal';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import type { ApiDocument } from '@/types/api';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** YYYY-MM-DD en heure locale (pas d'UTC : un doc du 1er ne doit pas glisser au 30). */
function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(d.getFullYear())}-${m}-${day}`;
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Cellules du mois : null pour les jours hors mois (alignement lundi-first). */
function buildMonthCells(anchor: Date): ReadonlyArray<Date | null> {
  const first = firstOfMonth(anchor);
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Calendrier admin : les documents datés (champ « date du document ») sont
 * posés sur leur jour ; un clic ouvre l'aperçu en modale, où la date peut
 * être posée, déplacée ou retirée. Les documents sans date sont listés à
 * part pour être rattachés au calendrier.
 */
export function CalendarAdminPage(): React.ReactElement {
  const [docs, setDocs] = useState<ReadonlyArray<ApiDocument>>([]);
  const [anchor, setAnchor] = useState<Date>(firstOfMonth(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    listDocuments()
      .then((all) => {
        if (!state.cancelled) {
          setDocs(all);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      })
      .finally(() => {
        if (!state.cancelled) setLoading(false);
      });
    return (): void => { state.cancelled = true; };
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, ApiDocument[]>();
    for (const doc of docs) {
      if (doc.documentDate === null) continue;
      const list = map.get(doc.documentDate) ?? [];
      list.push(doc);
      map.set(doc.documentDate, list);
    }
    return map;
  }, [docs]);

  const undated = useMemo(
    () => docs.filter((d) => d.documentDate === null),
    [docs],
  );

  const cells = useMemo(() => buildMonthCells(anchor), [anchor]);
  const todayIso = isoDay(new Date());
  const monthLabel = anchor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const datedThisMonth = cells.reduce(
    (count, cell) => (cell === null ? count : count + (byDay.get(isoDay(cell))?.length ?? 0)),
    0,
  );

  function handleDocUpdated(updated: ApiDocument): void {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setPreviewDoc(updated);
  }

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Espace documentaire</div>
            <h1 className="dash__banner-title">Calendrier</h1>
            <p className="dash__banner-desc">
              Les documents datés (échéances, interventions, plannings) posés sur le mois.
              Cliquez sur un document pour l&apos;ouvrir, changer sa date ou le retirer du calendrier.
            </p>
          </div>
          <div className="dash__banner-stats">
            <div className="dash-stat">
              <div className="dash-stat__label">Ce mois</div>
              <div className="dash-stat__value">{datedThisMonth}</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat__label">Sans date</div>
              <div className="dash-stat__value dash-stat__value--accent">{undated.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          {error !== null ? (
            <p role="alert" className="alert alert--bad">{error}</p>
          ) : null}

          <div className="card cal-card">
            <div className="cal-head">
              <div className="cal-head__nav">
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label="Mois précédent"
                  onClick={(): void => { setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1)); }}
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <span className="cal-head__label">{monthLabel}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label="Mois suivant"
                  onClick={(): void => { setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1)); }}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={(): void => { setAnchor(firstOfMonth(new Date())); }}
              >
                Aujourd&apos;hui
              </button>
            </div>

            {loading ? (
              <p className="empty-state">Chargement…</p>
            ) : (
              <div className="cal-grid" role="grid" aria-label={`Calendrier ${monthLabel}`}>
                {WEEKDAYS.map((day) => (
                  <div key={day} className="cal-weekday">{day}</div>
                ))}
                {cells.map((cell, i) => {
                  if (cell === null) {
                    return <div key={`out-${String(i)}`} className="cal-cell cal-cell--out" aria-hidden />;
                  }
                  const iso = isoDay(cell);
                  const dayDocs = byDay.get(iso) ?? [];
                  return (
                    <div key={iso} className={`cal-cell ${iso === todayIso ? 'cal-cell--today' : ''}`}>
                      <div className="cal-cell__num num">{cell.getDate()}</div>
                      {dayDocs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          className="cal-chip"
                          title={`${doc.title} — ${CATEGORY_LABELS[doc.category]}`}
                          onClick={(): void => { setPreviewDoc(doc); }}
                        >
                          {doc.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {undated.length > 0 ? (
            <section className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <h2 style={{ fontSize: 15, fontWeight: 500 }}>
                Documents sans date ({undated.length})
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: '0.25rem' }}>
                Ouvrez un document pour lui donner une date et le poser sur le calendrier.
              </p>
              <ul className="cal-undated">
                {undated.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className="cal-undated__row"
                      onClick={(): void => { setPreviewDoc(doc); }}
                    >
                      <Icon name="doc" size={14} />
                      <span className="cal-undated__title">{doc.title}</span>
                      <span className="tag">{CATEGORY_LABELS[doc.category]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
      </div>

      {previewDoc !== null ? (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={(): void => { setPreviewDoc(null); }}
          onDocUpdated={handleDocUpdated}
        />
      ) : null}
    </ProShell>
  );
}

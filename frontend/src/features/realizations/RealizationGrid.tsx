import type React from 'react';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { MODAL_AFTER_PHOTO, MODAL_BEFORE_PHOTO, projectPhotoFor } from '@/components/photos';
import { Reveal } from '@/components/Reveal';
import { StripedSlot } from '@/components/StripedSlot';
import { Tag } from '@/components/Tag';
import type { ApiRealization } from '@/types/api';

export interface RealizationGridProps {
  items: ReadonlyArray<ApiRealization>;
}

export function RealizationGrid({ items }: RealizationGridProps): React.ReactElement {
  const [focused, setFocused] = useState<ApiRealization | null>(null);

  if (items.length === 0) {
    return <p className="empty-state">Aucune réalisation pour ces filtres.</p>;
  }

  return (
    <>
      <ul data-testid="realization-grid" className="real-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((r, i) => (
          <Reveal key={r.id} delay={(i % 3) * 60} as="li">
            <button
              type="button"
              className="real-card"
              style={{ display: 'block', textAlign: 'left', width: '100%', background: 'transparent', border: 0, padding: 0 }}
              onClick={(): void => {
                setFocused(r);
              }}
            >
              <StripedSlot
                photo={projectPhotoFor(i)}
                src={r.afterImageUrl ?? r.beforeImageUrl}
                photoWidth={800}
                photoAlt={r.title}
                ratio="4-3"
                className="real-card__slot"
              >
                <div className="real-card__slot-tag-tl">
                  <Tag accent>{r.equipmentType}</Tag>
                </div>
                <div className="real-card__slot-tag-br">
                  <Tag>{r.type}</Tag>
                </div>
              </StripedSlot>
              <div className="real-card__body">
                <div className="real-card__meta">{r.region}</div>
                <h3 className="real-card__title">{r.title}</h3>
                <div className="real-card__sub">
                  <span>{r.description.length > 64 ? `${r.description.slice(0, 64)}…` : r.description}</span>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </ul>

      {focused !== null ? (
        <RealizationModal item={focused} onClose={(): void => { setFocused(null); }} />
      ) : null}
    </>
  );
}

interface ModalProps {
  item: ApiRealization;
  onClose: () => void;
}

function hasImage(url: string | null): url is string {
  return url !== null && url !== '';
}

function RealizationModal({ item, onClose }: ModalProps): React.ReactElement {
  useEffect((): (() => void) => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return (): void => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // La photo « avant » est facultative : si une seule vraie photo existe, on
  // l'affiche seule en pleine largeur plutôt que de combler avec une photo
  // d'illustration trompeuse. Les placeholders ne servent qu'aux réalisations
  // de démo sans aucune photo.
  const hasBefore = hasImage(item.beforeImageUrl);
  const hasAfter = hasImage(item.afterImageUrl);
  const singlePhoto = hasBefore !== hasAfter;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        <div className={`modal__cover ${singlePhoto ? 'modal__cover--single' : ''}`}>
          {singlePhoto ? (
            <StripedSlot
              ratio="4-3"
              caption={hasAfter ? 'Après installation' : 'Avant intervention'}
              src={hasAfter ? item.afterImageUrl : item.beforeImageUrl}
              photoWidth={1200}
              photoAlt={hasAfter ? 'Après intervention' : 'Avant intervention'}
            />
          ) : (
            <>
              <StripedSlot
                ratio="1-1"
                caption="Avant"
                photo={MODAL_BEFORE_PHOTO}
                src={item.beforeImageUrl}
                photoWidth={800}
                photoAlt="Avant intervention"
              />
              <StripedSlot
                ratio="1-1"
                caption="Après installation"
                photo={MODAL_AFTER_PHOTO}
                src={item.afterImageUrl}
                photoWidth={800}
                photoAlt="Après intervention"
              />
            </>
          )}
        </div>
        <div className="modal__body">
          <div className="modal__head">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                {item.region}
              </div>
              <h2 id="modal-title" className="modal__title">{item.title}</h2>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={onClose}
              aria-label="Fermer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <p style={{ marginTop: '1rem', fontSize: 15, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            {item.description}
          </p>
          <div className="modal__grid">
            <div>
              <div className="modal__cell-label">Secteur</div>
              <div className="modal__cell-value">{item.type}</div>
            </div>
            <div>
              <div className="modal__cell-label">Équipement</div>
              <div className="modal__cell-value">{item.equipmentType}</div>
            </div>
            <div>
              <div className="modal__cell-label">Région</div>
              <div className="modal__cell-value">{item.region}</div>
            </div>
            <div>
              <div className="modal__cell-label">Publication</div>
              <div className="modal__cell-value">
                {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { uploadImage } from '@/api/media';
import {
  createRealization,
  deleteRealization,
  listRealizations,
  updateRealization,
} from '@/api/realizations';
import { Icon } from '@/components/Icon';
import { ProShell } from '@/components/ProShell';
import type { ApiRealization, RealizationInput } from '@/types/api';
import { EquipmentType, RealizationType } from '@/types/enums';
import type {
  EquipmentType as EquipmentTypeT,
  RealizationType as RealizationTypeT,
} from '@/types/enums';

const TYPE_LABELS: Record<RealizationTypeT, string> = {
  RESIDENTIAL: 'Résidentiel',
  TERTIARY: 'Tertiaire',
};

const EQUIPMENT_LABELS: Record<EquipmentTypeT, string> = {
  AC: 'Climatisation',
  HEAT_PUMP: 'Pompe à chaleur',
  VMC: 'VMC',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RealizationsAdminPage(): React.ReactElement {
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  // null = liste ; 'new' = création ; objet = édition
  const [editing, setEditing] = useState<ApiRealization | 'new' | null>(null);
  // Réalisation dont on visionne les photos en carrousel (clic sur la vignette).
  const [gallery, setGallery] = useState<ApiRealization | null>(null);

  const reload = (): void => {
    setRefreshTick((t) => t + 1);
  };

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    async function load(): Promise<void> {
      try {
        const data = await listRealizations();
        if (!state.cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      } finally {
        if (!state.cancelled) setLoading(false);
      }
    }
    void load();
    return (): void => {
      state.cancelled = true;
    };
  }, [refreshTick]);

  async function handleDelete(item: ApiRealization): Promise<void> {
    if (!window.confirm(`Supprimer « ${item.title} » ? Cette action est définitive.`)) {
      return;
    }
    try {
      await deleteRealization(item.id);
      reload();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Gestion éditoriale</div>
            <h1 className="dash__banner-title">Réalisations</h1>
            <p className="dash__banner-desc">
              Créez, modifiez et supprimez les chantiers affichés sur le site public,
              avec leurs photos avant / après.
            </p>
          </div>
          <div className="dash__banner-stats">
            <button
              type="button"
              className="btn btn--accent btn--lg"
              onClick={(): void => { setEditing('new'); }}
            >
              <Icon name="arrow-up-right" size={16} /> Nouvelle réalisation
            </button>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          {error !== null ? (
            <p role="alert" className="alert alert--bad">{error}</p>
          ) : null}

          {editing !== null ? (
            <RealizationForm
              key={editing === 'new' ? 'new' : editing.id}
              initial={editing === 'new' ? null : editing}
              onCancel={(): void => { setEditing(null); }}
              onSaved={(): void => {
                setEditing(null);
                reload();
              }}
            />
          ) : null}

          {loading ? (
            <p className="empty-state">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="empty-state">Aucune réalisation. Cliquez sur « Nouvelle réalisation ».</p>
          ) : (
            <div className="admin-list">
              {items.map((item) => (
                <article key={item.id} className="admin-row card">
                  {galleryImages(item).length > 0 ? (
                    <button
                      type="button"
                      className="admin-row__thumb admin-row__thumb--btn"
                      title="Voir les photos"
                      aria-label={`Voir les photos de « ${item.title} »`}
                      onClick={(): void => { setGallery(item); }}
                    >
                      <img src={galleryImages(item)[0]?.url ?? ''} alt="" loading="lazy" />
                      <span className="admin-row__thumb-count num">
                        <Icon name="image" size={11} /> {galleryImages(item).length}
                      </span>
                    </button>
                  ) : (
                    <div className="admin-row__thumb">
                      <div className="admin-row__thumb-empty" aria-hidden>
                        <Icon name="image" size={18} />
                      </div>
                    </div>
                  )}
                  <div className="admin-row__body">
                    <div className="admin-row__title">{item.title}</div>
                    <div className="admin-row__meta">
                      <span className="tag">{EQUIPMENT_LABELS[item.equipmentType]}</span>
                      <span className="tag">{TYPE_LABELS[item.type]}</span>
                      <span className="admin-row__region">{item.region}</span>
                      <span className="admin-row__date num">{item.publishedAt.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="admin-row__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={(): void => { setEditing(item); }}
                    >
                      <Icon name="edit" size={14} /> Modifier
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={(): void => { void handleDelete(item); }}
                    >
                      <Icon name="trash" size={14} /> Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {gallery !== null ? (
        <ImageCarouselModal
          title={gallery.title}
          images={galleryImages(gallery)}
          onClose={(): void => { setGallery(null); }}
        />
      ) : null}
    </ProShell>
  );
}

interface GalleryImage {
  url: string;
  caption: string;
}

/** Photos réelles d'une réalisation (l'« avant » est facultatif). */
function galleryImages(item: ApiRealization): ReadonlyArray<GalleryImage> {
  const images: GalleryImage[] = [];
  if (item.beforeImageUrl !== null && item.beforeImageUrl !== '') {
    images.push({ url: item.beforeImageUrl, caption: 'Avant intervention' });
  }
  if (item.afterImageUrl !== null && item.afterImageUrl !== '') {
    images.push({ url: item.afterImageUrl, caption: 'Après installation' });
  }
  return images;
}

interface ImageCarouselModalProps {
  title: string;
  images: ReadonlyArray<GalleryImage>;
  onClose: () => void;
}

/** Carrousel plein écran : navigation par flèches (boutons + clavier), Échap ferme. */
function ImageCarouselModal({ title, images, onClose }: ImageCarouselModalProps): React.ReactElement {
  const [index, setIndex] = useState(0);

  const prev = useCallback((): void => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const next = useCallback((): void => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect((): (() => void) => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return (): void => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const current = images[index];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Photos de « ${title} »`}
      onClick={onClose}
    >
      <div className="lightbox" onClick={(e): void => { e.stopPropagation(); }}>
        <div className="lightbox__head">
          <div>
            <div className="lightbox__title">{title}</div>
            <div className="lightbox__caption">
              {current?.caption} — <span className="num">{index + 1} / {images.length}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="lightbox__stage">
          {images.length > 1 ? (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              onClick={prev}
              aria-label="Photo précédente"
            >
              <Icon name="chevron-left" size={20} />
            </button>
          ) : null}
          <img src={current?.url ?? ''} alt={`${current?.caption ?? ''} — ${title}`} className="lightbox__img" />
          {images.length > 1 ? (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              onClick={next}
              aria-label="Photo suivante"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="lightbox__dots" role="tablist" aria-label="Photos">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={img.caption}
                className={`lightbox__dot ${i === index ? 'is-active' : ''}`}
                onClick={(): void => { setIndex(i); }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface RealizationFormProps {
  initial: ApiRealization | null;
  onSaved: () => void;
  onCancel: () => void;
}

function RealizationForm({ initial, onSaved, onCancel }: RealizationFormProps): React.ReactElement {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<RealizationTypeT>(initial?.type ?? RealizationType.RESIDENTIAL);
  const [equipmentType, setEquipmentType] = useState<EquipmentTypeT>(initial?.equipmentType ?? EquipmentType.AC);
  const [region, setRegion] = useState(initial?.region ?? '');
  const [publishedAt, setPublishedAt] = useState((initial?.publishedAt ?? todayIso()).slice(0, 10));
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(initial?.beforeImageUrl ?? null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(initial?.afterImageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload: RealizationInput = {
      title: title.trim(),
      description: description.trim(),
      type,
      equipmentType,
      region: region.trim(),
      beforeImageUrl,
      afterImageUrl,
      publishedAt,
    };
    try {
      if (initial === null) {
        await createRealization(payload);
      } else {
        await updateRealization(initial.id, payload);
      }
      onSaved();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detail = err.violations.length > 0
          ? err.violations.map((v) => v.message).join(' ')
          : err.message;
        setFormError(detail);
      } else {
        setFormError('Enregistrement impossible.');
      }
      setSubmitting(false);
    }
  }

  return (
    <form className="card card--elevated admin-form" onSubmit={(e): void => { void handleSubmit(e); }}>
      <div className="admin-form__head">
        <h2 className="admin-form__title">
          {initial === null ? 'Nouvelle réalisation' : 'Modifier la réalisation'}
        </h2>
        <button type="button" className="btn btn--ghost btn--icon" onClick={onCancel} aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {formError !== null ? (
        <p role="alert" className="alert alert--bad">{formError}</p>
      ) : null}

      <div className="field-group">
        <label htmlFor="r-title" className="field-group__label">Titre</label>
        <input id="r-title" className="field" value={title} required
          onChange={(e): void => { setTitle(e.target.value); }} />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="r-type" className="field-group__label">Type</label>
          <select id="r-type" className="field-select" value={type}
            onChange={(e): void => { setType(e.target.value as RealizationTypeT); }}>
            {Object.entries(TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="r-equip" className="field-group__label">Équipement</label>
          <select id="r-equip" className="field-select" value={equipmentType}
            onChange={(e): void => { setEquipmentType(e.target.value as EquipmentTypeT); }}>
            {Object.entries(EQUIPMENT_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="r-region" className="field-group__label">Région</label>
          <input id="r-region" className="field" value={region} required
            onChange={(e): void => { setRegion(e.target.value); }} placeholder="Île-de-France" />
        </div>
        <div className="field-group">
          <label htmlFor="r-date" className="field-group__label">Date de publication</label>
          <input id="r-date" type="date" className="field" value={publishedAt}
            onChange={(e): void => { setPublishedAt(e.target.value); }} />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="r-desc" className="field-group__label">Description</label>
        <textarea id="r-desc" className="field" rows={3} value={description} required
          onChange={(e): void => { setDescription(e.target.value); }} />
      </div>

      <div className="field-row">
        <ImageField label="Photo avant" value={beforeImageUrl} onChange={setBeforeImageUrl} onError={setFormError} />
        <ImageField label="Photo après" value={afterImageUrl} onChange={setAfterImageUrl} onError={setFormError} />
      </div>

      <div className="admin-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

interface ImageFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (message: string) => void;
}

function ImageField({ label, value, onChange, onError }: ImageFieldProps): React.ReactElement {
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err: unknown) {
      onError(err instanceof ApiError ? err.message : "Échec de l'upload de l'image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field-group">
      <span className="field-group__label">{label}</span>
      <div className="image-field">
        <div className="image-field__preview">
          {value !== null && value !== '' ? (
            <img src={value} alt="" />
          ) : (
            <div className="image-field__empty" aria-hidden><Icon name="image" size={20} /></div>
          )}
        </div>
        <div className="image-field__controls">
          <label className="btn btn--ghost btn--sm">
            {busy ? 'Envoi…' : value !== null && value !== '' ? 'Remplacer' : 'Téléverser'}
            <input type="file" accept="image/*" hidden disabled={busy}
              onChange={(e): void => { void handleFile(e); }} />
          </label>
          {value !== null && value !== '' ? (
            <button type="button" className="btn btn--ghost btn--sm"
              onClick={(): void => { onChange(null); }}>
              Retirer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

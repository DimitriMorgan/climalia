import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/api/client';
import { listClientOptions } from '@/api/clients';
import { assignDocumentClients, listDocuments, uploadDocument } from '@/api/documents';
import { Icon } from '@/components/Icon';
import { ProShell } from '@/components/ProShell';
import { formatSize } from '@/features/documents/DocumentList';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import { useAuthStore } from '@/stores/authStore';
import type { ApiClientOption, ApiDocument } from '@/types/api';
import { DocumentAudience, DocumentCategory } from '@/types/enums';
import type {
  DocumentAudience as DocumentAudienceT,
  DocumentCategory as DocumentCategoryT,
} from '@/types/enums';

export function DepotPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [companies, setCompanies] = useState<ReadonlyArray<ApiClientOption>>([]);
  const [uploaded, setUploaded] = useState<ReadonlyArray<ApiDocument>>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect((): void => {
    listClientOptions()
      .then(setCompanies)
      .catch(() => {
        // Le sélecteur d'entreprises reste vide : l'upload interne fonctionne quand même.
      });
  }, []);

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Espace documentaire</div>
            <h1 className="dash__banner-title">Dépôt de documents</h1>
            <p className="dash__banner-desc">
              Déposez plannings, fiches techniques, comptes-rendus, attestations et factures.
              Les livrables clients peuvent être affectés à une ou plusieurs entreprises.
            </p>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          <UploadForm
            companies={companies}
            onUploaded={(doc): void => {
              setUploaded((prev) => [doc, ...prev]);
              setRefreshTick((t) => t + 1);
            }}
          />

          {uploaded.length > 0 ? (
            <section className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <h2 style={{ fontSize: 15, fontWeight: 500 }}>Déposés à l&apos;instant</h2>
              <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
                {uploaded.map((doc) => (
                  <li key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 14 }}>
                    <Icon name="check" size={14} style={{ color: 'var(--good)' }} />
                    <Link to={`/espace-pro/documents/${doc.id}`} style={{ fontWeight: 500 }}>
                      {doc.title}
                    </Link>
                    <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>
                      {CATEGORY_LABELS[doc.category]} · {formatSize(doc.sizeBytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {isAdmin ? (
            <DispatchSection companies={companies} refreshTick={refreshTick} />
          ) : null}
        </main>
      </div>
    </ProShell>
  );
}

interface UploadFormProps {
  companies: ReadonlyArray<ApiClientOption>;
  onUploaded: (doc: ApiDocument) => void;
}

function UploadForm({ companies, onUploaded }: UploadFormProps): React.ReactElement {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategoryT>(DocumentCategory.INTERVENTION_REPORT);
  const [audience, setAudience] = useState<DocumentAudienceT>(DocumentAudience.INTERNAL);
  const [region, setRegion] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<ReadonlyArray<string>>([]);
  const [notify, setNotify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const next = e.target.files?.[0] ?? null;
    setFile(next);
    if (next !== null && title.trim() === '') {
      // Pré-remplit le titre à partir du nom de fichier (sans extension).
      setTitle(next.name.replace(/\.[^.]+$/, '').replaceAll(/[-_]+/g, ' '));
    }
  }

  function toggleCompany(id: string): void {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (file === null) {
      setFormError('Sélectionnez un fichier à déposer.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const doc = await uploadDocument({
        file,
        title: title.trim(),
        category,
        audience,
        region: region.trim() === '' ? undefined : region.trim(),
        documentDate: documentDate === '' ? undefined : documentDate,
        assignedClientIds: audience === DocumentAudience.CLIENT ? selectedCompanies : undefined,
        notify: audience === DocumentAudience.CLIENT && selectedCompanies.length > 0 ? notify : false,
      });
      onUploaded(doc);
      setFile(null);
      setTitle('');
      setRegion('');
      setDocumentDate('');
      setSelectedCompanies([]);
      setNotify(false);
      if (fileInput.current !== null) fileInput.current.value = '';
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.violations.length > 0
          ? err.violations.map((v) => v.message).join(' ')
          : err.message);
      } else {
        setFormError('Dépôt impossible.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card card--elevated admin-form" onSubmit={(e): void => { void handleSubmit(e); }}>
      <div className="admin-form__head">
        <h2 className="admin-form__title">Nouveau document</h2>
      </div>

      {formError !== null ? (
        <p role="alert" className="alert alert--bad">{formError}</p>
      ) : null}

      <div className="field-group">
        <span className="field-group__label">Fichier (PDF, image… — 20 Mo max)</span>
        <label className={`upload-drop ${file !== null ? 'has-file' : ''}`}>
          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.doc,.docx,application/pdf,image/*"
          />
          {file === null ? (
            <>
              <Icon name="arrow-down" size={18} />
              <span>Cliquez pour choisir un fichier</span>
            </>
          ) : (
            <>
              <Icon name="doc" size={18} />
              <span>{file.name}</span>
              <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>{formatSize(file.size)}</span>
            </>
          )}
        </label>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="d-title" className="field-group__label">Titre</label>
          <input id="d-title" className="field" value={title} required
            onChange={(e): void => { setTitle(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="d-cat" className="field-group__label">Catégorie</label>
          <select id="d-cat" className="field-select" value={category}
            onChange={(e): void => { setCategory(e.target.value as DocumentCategoryT); }}>
            {Object.values(DocumentCategory).map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <span className="field-group__label">Destination</span>
          <div className="radio-row">
            <label className="radio-chip">
              <input
                type="radio"
                name="audience"
                checked={audience === DocumentAudience.INTERNAL}
                onChange={(): void => { setAudience(DocumentAudience.INTERNAL); }}
              />
              Ressource interne (salariés)
            </label>
            <label className="radio-chip">
              <input
                type="radio"
                name="audience"
                checked={audience === DocumentAudience.CLIENT}
                onChange={(): void => { setAudience(DocumentAudience.CLIENT); }}
              />
              Livrable client
            </label>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="d-region" className="field-group__label">Région (optionnel)</label>
          <input id="d-region" className="field" value={region} placeholder="Île-de-France"
            onChange={(e): void => { setRegion(e.target.value); }} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="d-date" className="field-group__label">
            Date du document (optionnel — échéance, intervention…)
          </label>
          <input id="d-date" type="date" className="field" value={documentDate}
            onChange={(e): void => { setDocumentDate(e.target.value); }} />
          <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: '0.35rem' }}>
            Les documents datés apparaissent sur le calendrier de l&apos;administrateur.
          </p>
        </div>
        <div className="field-group" aria-hidden />
      </div>

      {audience === DocumentAudience.CLIENT ? (
        <div className="field-group">
          <span className="field-group__label">
            Affecter aux entreprises clientes {companies.length === 0 ? '(aucune disponible)' : ''}
          </span>
          <div className="check-grid">
            {companies.map((company) => (
              <label key={company.id} className="radio-chip">
                <input
                  type="checkbox"
                  checked={selectedCompanies.includes(company.id)}
                  onChange={(): void => { toggleCompany(company.id); }}
                />
                {company.label}
              </label>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: '0.5rem' }}>
            Sans affectation, le livrable reste dans le pool « à dispatcher » de l&apos;administrateur.
          </p>
          <label className="radio-chip" style={{ marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={notify}
              disabled={selectedCompanies.length === 0}
              onChange={(): void => { setNotify((v) => !v); }}
            />
            Notifier les contacts par e-mail
          </label>
          {notify && selectedCompanies.length > 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: '0.4rem' }}>
              Les contacts abonnés des entreprises sélectionnées recevront un e-mail avec un lien vers le document.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="admin-form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting || file === null}>
          {submitting ? 'Dépôt en cours…' : 'Déposer le document'}
        </button>
      </div>
    </form>
  );
}

interface DispatchSectionProps {
  companies: ReadonlyArray<ApiClientOption>;
  refreshTick: number;
}

/** Vue admin : livrables clients et leur affectation aux entreprises. */
function DispatchSection({ companies, refreshTick }: DispatchSectionProps): React.ReactElement {
  const [docs, setDocs] = useState<ReadonlyArray<ApiDocument>>([]);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReadonlyArray<string>>([]);
  const [notifyOnSave, setNotifyOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTick, setLocalTick] = useState(0);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    listDocuments(onlyUnassigned ? { unassigned: true } : {})
      .then((all) => {
        if (!state.cancelled) {
          setDocs(all.filter((d) => d.audience === 'CLIENT'));
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      });
    return (): void => { state.cancelled = true; };
  }, [onlyUnassigned, refreshTick, localTick]);

  function startEdit(doc: ApiDocument): void {
    setEditing(doc.id);
    setDraft((doc.assignedClients ?? []).map((c) => c.id));
    setNotifyOnSave(false);
  }

  function toggleDraft(id: string): void {
    setDraft((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function saveEdit(docId: string): Promise<void> {
    setSaving(true);
    try {
      await assignDocumentClients(docId, draft, notifyOnSave);
      setEditing(null);
      setLocalTick((t) => t + 1);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Affectation impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: 15, fontWeight: 500 }}>Dispatch des livrables clients</h2>
        <label className="radio-chip">
          <input
            type="checkbox"
            checked={onlyUnassigned}
            onChange={(): void => { setOnlyUnassigned((v) => !v); }}
          />
          Non affectés uniquement
        </label>
      </div>

      {error !== null ? (
        <p role="alert" className="alert alert--bad" style={{ marginTop: '0.75rem' }}>{error}</p>
      ) : null}

      {docs.length === 0 ? (
        <p className="empty-state" style={{ marginTop: '1rem' }}>
          {onlyUnassigned ? 'Aucun livrable en attente d’affectation.' : 'Aucun livrable client.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {docs.map((doc) => (
            <li key={doc.id} className="dispatch-row">
              <div className="dispatch-row__main">
                <Link to={`/espace-pro/documents/${doc.id}`} style={{ fontWeight: 500 }}>
                  {doc.title}
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center' }}>
                  <span className="tag">{CATEGORY_LABELS[doc.category]}</span>
                  {doc.uploadedBy != null ? (
                    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>par {doc.uploadedBy}</span>
                  ) : null}
                  {(doc.assignedClients ?? []).length === 0 ? (
                    <span className="tag" style={{ color: 'var(--bad)' }}>Non affecté</span>
                  ) : (
                    (doc.assignedClients ?? []).map((c) => (
                      <span key={c.id} className="tag">{c.label}</span>
                    ))
                  )}
                </div>
                {editing === doc.id ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="check-grid">
                      {companies.map((company) => (
                        <label key={company.id} className="radio-chip">
                          <input
                            type="checkbox"
                            checked={draft.includes(company.id)}
                            onChange={(): void => { toggleDraft(company.id); }}
                          />
                          {company.label}
                        </label>
                      ))}
                    </div>
                    <label className="radio-chip" style={{ marginTop: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={notifyOnSave}
                        onChange={(): void => { setNotifyOnSave((v) => !v); }}
                      />
                      Notifier par e-mail les entreprises nouvellement affectées
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button type="button" className="btn btn--primary btn--sm" disabled={saving}
                        onClick={(): void => { void saveEdit(doc.id); }}>
                        {saving ? 'Enregistrement…' : 'Enregistrer l’affectation'}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        onClick={(): void => { setEditing(null); }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              {editing !== doc.id ? (
                <button type="button" className="btn btn--ghost btn--sm"
                  onClick={(): void => { startEdit(doc); }}>
                  <Icon name="edit" size={14} /> Affecter
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

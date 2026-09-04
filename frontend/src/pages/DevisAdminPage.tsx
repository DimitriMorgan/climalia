import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { listContactRequests, replyToContactRequest, updateContactStatus } from '@/api/contact';
import { Icon } from '@/components/Icon';
import { ProShell } from '@/components/ProShell';
import type { ApiContactRequest } from '@/types/api';
import { ContactStatus } from '@/types/enums';
import type { ContactStatus as ContactStatusT, ProjectType } from '@/types/enums';

const PROJECT_LABELS: Record<ProjectType, string> = {
  INSTALLATION_AC: 'Climatisation',
  HEAT_PUMP: 'Pompe à chaleur',
  VMC: 'VMC',
  MAINTENANCE: 'Entretien',
  REPAIR: 'Dépannage',
};

const STATUS_LABELS: Record<ContactStatusT, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  CLOSED: 'Clôturé',
};

type StatusFilter = ContactStatusT | 'ALL';

function formatDate(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DevisAdminPage(): React.ReactElement {
  const [rows, setRows] = useState<ReadonlyArray<ApiContactRequest>>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replying, setReplying] = useState<ApiContactRequest | null>(null);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    listContactRequests()
      .then((all) => {
        if (!state.cancelled) {
          setRows(all);
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

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: rows.length, NEW: 0, CONTACTED: 0, CLOSED: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === 'ALL' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  async function changeStatus(id: string, status: ContactStatusT): Promise<void> {
    try {
      const updated = await updateContactStatus(id, status);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour impossible.');
    }
  }

  const filters: ReadonlyArray<{ id: StatusFilter; label: string }> = [
    { id: 'ALL', label: 'Toutes' },
    { id: ContactStatus.NEW, label: STATUS_LABELS.NEW },
    { id: ContactStatus.CONTACTED, label: STATUS_LABELS.CONTACTED },
    { id: ContactStatus.CLOSED, label: STATUS_LABELS.CLOSED },
  ];

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Gestion commerciale</div>
            <h1 className="dash__banner-title">Demandes de devis</h1>
            <p className="dash__banner-desc">
              Les demandes envoyées via le formulaire de contact du site. Suivez leur traitement :
              nouveau → contacté → clôturé.
            </p>
          </div>
          <div className="dash__banner-stats">
            <div className="dash-stat">
              <div className="dash-stat__label">Total</div>
              <div className="dash-stat__value">{counts.ALL}</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat__label">Nouvelles</div>
              <div className="dash-stat__value dash-stat__value--accent">{counts.NEW}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn btn--sm ${filter === f.id ? 'btn--primary' : 'btn--ghost'}`}
                onClick={(): void => { setFilter(f.id); }}
              >
                {f.label} <span className="num">({counts[f.id]})</span>
              </button>
            ))}
          </div>

          {error !== null ? (
            <p role="alert" className="alert alert--bad">{error}</p>
          ) : null}

          {loading ? (
            <p className="empty-state">Chargement…</p>
          ) : visible.length === 0 ? (
            <p className="empty-state">Aucune demande pour ce filtre.</p>
          ) : (
            <div className="admin-list">
              {visible.map((req) => (
                <article key={req.id} className={`card devis-card ${req.status === 'NEW' ? 'devis-card--new' : ''}`}>
                  <div className="devis-card__head">
                    <div>
                      <div className="devis-card__name">{req.fullName}</div>
                      <div className="devis-card__meta">
                        <span className="tag">{PROJECT_LABELS[req.projectType]}</span>
                        {req.surface !== null ? <span>{req.surface} m²</span> : null}
                        {req.deadline !== null ? <span>Échéance : {formatDate(req.deadline)}</span> : null}
                        <span>·</span>
                        <span>Reçue le {formatDate(req.createdAt)}</span>
                      </div>
                    </div>
                    <label className="devis-card__status">
                      <span className="sr-only">Statut de la demande de {req.fullName}</span>
                      <select
                        className="field-select"
                        value={req.status}
                        onChange={(e): void => {
                          void changeStatus(req.id, e.target.value as ContactStatusT);
                        }}
                      >
                        {Object.values(ContactStatus).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="devis-card__contact">
                    <a href={`mailto:${req.email}`}><Icon name="mail" size={13} /> {req.email}</a>
                    <a href={`tel:${req.phone.replaceAll(' ', '')}`}><Icon name="phone" size={13} /> {req.phone}</a>
                    <span><Icon name="pin" size={13} /> {req.postalCode}</span>
                  </div>

                  <p
                    className={`devis-card__message ${expanded === req.id ? 'is-expanded' : ''}`}
                    onClick={(): void => { setExpanded((cur) => (cur === req.id ? null : req.id)); }}
                  >
                    {req.message}
                  </p>

                  <div className="devis-card__foot">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={(): void => { setReplying(req); }}
                    >
                      <Icon name="mail" size={14} /> Répondre
                    </button>
                    {req.repliedAt !== null ? (
                      <span className="devis-card__replied">
                        <Icon name="check" size={13} /> Répondu le {formatDate(req.repliedAt)}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {replying !== null ? (
        <ReplyModal
          request={replying}
          onClose={(): void => { setReplying(null); }}
          onReplied={(updated): void => {
            setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setReplying(null);
          }}
        />
      ) : null}
    </ProShell>
  );
}

interface ReplyModalProps {
  request: ApiContactRequest;
  onClose: () => void;
  onReplied: (updated: ApiContactRequest) => void;
}

/** Libellé projet en cours de phrase : minuscule sauf les sigles (VMC). */
function projectLabelInline(type: ProjectType): string {
  const label = PROJECT_LABELS[type];
  return label === label.toUpperCase() ? label : label.toLowerCase();
}

/** Réponse in-app : e-mail envoyé par le serveur, Reply-To = l'admin connecté. */
function ReplyModal({ request, onClose, onReplied }: ReplyModalProps): React.ReactElement {
  const [subject, setSubject] = useState(
    `Votre demande de devis ${projectLabelInline(request.projectType)} — Climalia`,
  );
  const [message, setMessage] = useState(
    `Bonjour ${request.fullName},\n\n`
    + 'Nous avons bien reçu votre demande concernant votre projet '
    + projectLabelInline(request.projectType)
    + (request.surface !== null ? ` (${String(request.surface)} m²)` : '')
    + ` dans le secteur ${request.postalCode}.\n\n`
    + '\n\n'
    + "Bien cordialement,\nL'équipe Climalia",
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const updated = await replyToContactRequest(request.id, {
        subject: subject.trim(),
        message: message.trim(),
      });
      onReplied(updated);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.violations.length > 0
          ? err.violations.map((v) => v.message).join(' ')
          : err.message);
      } else {
        setError("Envoi impossible. Vérifiez la configuration e-mail.");
      }
      setSending(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reply-modal-title"
      onClick={onClose}
    >
      <form
        className="modal admin-form"
        style={{ maxWidth: '42rem', padding: '1.75rem' }}
        onClick={(e): void => { e.stopPropagation(); }}
        onSubmit={(e): void => { void handleSubmit(e); }}
      >
        <div className="admin-form__head">
          <div>
            <h2 id="reply-modal-title" className="admin-form__title">
              Répondre à {request.fullName}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: '0.25rem' }}>
              E-mail envoyé à <strong>{request.email}</strong> — le prospect pourra vous répondre directement.
            </p>
          </div>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Fermer">
            <Icon name="close" size={16} />
          </button>
        </div>

        {error !== null ? (
          <p role="alert" className="alert alert--bad">{error}</p>
        ) : null}

        <div className="field-group">
          <label htmlFor="reply-subject" className="field-group__label">Objet</label>
          <input
            id="reply-subject"
            className="field"
            value={subject}
            required
            maxLength={200}
            onChange={(e): void => { setSubject(e.target.value); }}
          />
        </div>

        <div className="field-group">
          <label htmlFor="reply-message" className="field-group__label">Message</label>
          <textarea
            id="reply-message"
            className="field"
            rows={10}
            value={message}
            required
            onChange={(e): void => { setMessage(e.target.value); }}
          />
        </div>

        <div className="admin-form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn--primary" disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer la réponse'}
          </button>
        </div>
      </form>
    </div>
  );
}

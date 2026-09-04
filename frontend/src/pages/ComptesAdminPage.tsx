import type React from 'react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import {
  addClientContact,
  createClientCompany,
  listClientCompanies,
  updateClientCompany,
} from '@/api/clients';
import { createUser, deleteUser, listUsers, updateUser, updateUserFlags } from '@/api/users';
import { Icon } from '@/components/Icon';
import { ProShell, ROLE_BADGE_LABEL } from '@/components/ProShell';
import { useAuthStore } from '@/stores/authStore';
import type {
  ApiClientCompany,
  ApiManagedUser,
  ClientCompanyInput,
  ManagedUserInput,
} from '@/types/api';
import { ClientSegment, UserRole } from '@/types/enums';
import type { ClientSegment as ClientSegmentT, UserRole as UserRoleT } from '@/types/enums';

const SEGMENT_LABELS: Record<ClientSegmentT, string> = {
  PARTICULIER: 'Particulier',
  RESIDENTIEL: 'Résidentiel',
  TERTIAIRE: 'Tertiaire',
  INDUSTRIEL: 'Industriel',
  SYNDIC: 'Syndic',
};

/** Rôles gérables via /api/users (les comptes CLIENT passent par les entreprises). */
const STAFF_ROLES: ReadonlyArray<UserRoleT> = [
  UserRole.EMPLOYEE,
  UserRole.EDITOR,
  UserRole.ADMIN,
  UserRole.PARTNER,
];

type TabId = 'clients' | 'team';

export function ComptesAdminPage(): React.ReactElement {
  const [tab, setTab] = useState<TabId>('clients');

  return (
    <ProShell>
      <div className="dash__banner">
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">Administration</div>
            <h1 className="dash__banner-title">Clients & comptes</h1>
            <p className="dash__banner-desc">
              Entreprises clientes et leurs contacts, équipe interne et partenaires :
              création, édition et réinitialisation des accès.
            </p>
          </div>
        </div>
      </div>

      <div className="dash__body" style={{ gridTemplateColumns: '1fr' }}>
        <main className="dash__main">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button"
              className={`btn btn--sm ${tab === 'clients' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={(): void => { setTab('clients'); }}>
              Entreprises clientes
            </button>
            <button type="button"
              className={`btn btn--sm ${tab === 'team' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={(): void => { setTab('team'); }}>
              Équipe & partenaires
            </button>
          </div>

          {tab === 'clients' ? <ClientsSection /> : <TeamSection />}
        </main>
      </div>
    </ProShell>
  );
}

/* ================= Entreprises clientes ================= */

function ClientsSection(): React.ReactElement {
  const [companies, setCompanies] = useState<ReadonlyArray<ApiClientCompany>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiClientCompany | null>(null);
  const [addingContactTo, setAddingContactTo] = useState<ApiClientCompany | null>(null);
  const [tick, setTick] = useState(0);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    listClientCompanies()
      .then((all) => {
        if (!state.cancelled) { setCompanies(all); setError(null); }
      })
      .catch((err: unknown) => {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      })
      .finally(() => { if (!state.cancelled) setLoading(false); });
    return (): void => { state.cancelled = true; };
  }, [tick]);

  const reload = (): void => { setTick((t) => t + 1); };

  async function onToggleFlag(contactId: string, flags: { active?: boolean; notifyOnNewDocument?: boolean }): Promise<void> {
    try {
      await updateUserFlags(contactId, flags);
      reload();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour impossible.');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--accent btn--sm"
          onClick={(): void => { setCreating(true); setEditing(null); setAddingContactTo(null); }}>
          <Icon name="plus" size={14} /> Nouvelle entreprise
        </button>
      </div>

      {error !== null ? <p role="alert" className="alert alert--bad">{error}</p> : null}

      {creating ? (
        <CompanyForm
          initial={null}
          onCancel={(): void => { setCreating(false); }}
          onSaved={(): void => { setCreating(false); reload(); }}
        />
      ) : null}
      {editing !== null ? (
        <CompanyForm
          key={editing.id}
          initial={editing}
          onCancel={(): void => { setEditing(null); }}
          onSaved={(): void => { setEditing(null); reload(); }}
        />
      ) : null}
      {addingContactTo !== null ? (
        <ContactForm
          key={addingContactTo.id}
          company={addingContactTo}
          onCancel={(): void => { setAddingContactTo(null); }}
          onSaved={(): void => { setAddingContactTo(null); reload(); }}
        />
      ) : null}

      {loading ? (
        <p className="empty-state">Chargement…</p>
      ) : companies.length === 0 ? (
        <p className="empty-state">Aucune entreprise cliente.</p>
      ) : (
        <div className="admin-list">
          {companies.map((company) => (
            <article key={company.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{company.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="tag">{SEGMENT_LABELS[company.segment]}</span>
                    {company.region !== null ? <span className="tag">{company.region}</span> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={(): void => { setEditing(company); setCreating(false); setAddingContactTo(null); }}>
                    <Icon name="edit" size={14} /> Modifier
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={(): void => { setAddingContactTo(company); setCreating(false); setEditing(null); }}>
                    <Icon name="plus" size={14} /> Contact
                  </button>
                </div>
              </div>
              <ul style={{ listStyle: 'none', margin: '0.9rem 0 0', padding: 0, display: 'grid', gap: '0.4rem' }}>
                {company.contacts.map((contact) => (
                  <li key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 13, color: 'var(--ink-mute)', flexWrap: 'wrap', opacity: contact.active ? 1 : 0.55 }}>
                    <Icon name="user" size={13} />
                    <span style={{ color: 'var(--ink)' }}>{contact.firstName} {contact.lastName}</span>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '0.4rem' }}>
                      <label className="radio-chip" title="Autoriser la connexion à l'espace client">
                        <input
                          type="checkbox"
                          checked={contact.active}
                          onChange={(): void => { void onToggleFlag(contact.id, { active: !contact.active }); }}
                        />
                        Connexion
                      </label>
                      <label className="radio-chip" title="Reçoit les e-mails de notification de nouveaux documents">
                        <input
                          type="checkbox"
                          checked={contact.notifyOnNewDocument}
                          onChange={(): void => { void onToggleFlag(contact.id, { notifyOnNewDocument: !contact.notifyOnNewDocument }); }}
                        />
                        E-mails documents
                      </label>
                    </span>
                  </li>
                ))}
                {company.contacts.length === 0 ? (
                  <li style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Aucun contact.</li>
                ) : null}
              </ul>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

interface CompanyFormProps {
  initial: ApiClientCompany | null;
  onSaved: () => void;
  onCancel: () => void;
}

function CompanyForm({ initial, onSaved, onCancel }: CompanyFormProps): React.ReactElement {
  const [name, setName] = useState(initial?.name ?? '');
  const [segment, setSegment] = useState<ClientSegmentT>(initial?.segment ?? ClientSegment.TERTIAIRE);
  const [region, setRegion] = useState(initial?.region ?? '');
  const [contactEmail, setContactEmail] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload: ClientCompanyInput = {
      name: name.trim(),
      segment,
      region: region.trim() === '' ? null : region.trim(),
      ...(initial === null
        ? {
          contactEmail: contactEmail.trim(),
          contactFirstName: contactFirstName.trim(),
          contactLastName: contactLastName.trim(),
          password,
        }
        : {}),
    };
    try {
      if (initial === null) {
        await createClientCompany(payload);
      } else {
        await updateClientCompany(initial.id, payload);
      }
      onSaved();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError
        ? (err.violations.length > 0 ? err.violations.map((v) => v.message).join(' ') : err.message)
        : 'Enregistrement impossible.');
      setSubmitting(false);
    }
  }

  return (
    <form className="card card--elevated admin-form" onSubmit={(e): void => { void handleSubmit(e); }}>
      <div className="admin-form__head">
        <h2 className="admin-form__title">
          {initial === null ? 'Nouvelle entreprise cliente' : `Modifier « ${initial.name} »`}
        </h2>
        <button type="button" className="btn btn--ghost btn--icon" onClick={onCancel} aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {formError !== null ? <p role="alert" className="alert alert--bad">{formError}</p> : null}

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="c-name" className="field-group__label">Raison sociale</label>
          <input id="c-name" className="field" value={name} required
            onChange={(e): void => { setName(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="c-segment" className="field-group__label">Segment</label>
          <select id="c-segment" className="field-select" value={segment}
            onChange={(e): void => { setSegment(e.target.value as ClientSegmentT); }}>
            {Object.values(ClientSegment).map((s) => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="c-region" className="field-group__label">Région</label>
          <input id="c-region" className="field" value={region}
            onChange={(e): void => { setRegion(e.target.value); }} placeholder="Île-de-France" />
        </div>
      </div>

      {initial === null ? (
        <>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
            Contact initial (compte d&apos;accès à l&apos;espace client) :
          </p>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="c-cfn" className="field-group__label">Prénom</label>
              <input id="c-cfn" className="field" value={contactFirstName} required
                onChange={(e): void => { setContactFirstName(e.target.value); }} />
            </div>
            <div className="field-group">
              <label htmlFor="c-cln" className="field-group__label">Nom</label>
              <input id="c-cln" className="field" value={contactLastName} required
                onChange={(e): void => { setContactLastName(e.target.value); }} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="c-cem" className="field-group__label">Email</label>
              <input id="c-cem" type="email" className="field" value={contactEmail} required
                onChange={(e): void => { setContactEmail(e.target.value); }} />
            </div>
            <div className="field-group">
              <label htmlFor="c-cpw" className="field-group__label">Mot de passe</label>
              <input id="c-cpw" type="password" className="field" value={password} required minLength={6}
                onChange={(e): void => { setPassword(e.target.value); }} />
            </div>
          </div>
        </>
      ) : null}

      <div className="admin-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

interface ContactFormProps {
  company: ApiClientCompany;
  onSaved: () => void;
  onCancel: () => void;
}

function ContactForm({ company, onSaved, onCancel }: ContactFormProps): React.ReactElement {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await addClientContact(company.id, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      onSaved();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError
        ? (err.violations.length > 0 ? err.violations.map((v) => v.message).join(' ') : err.message)
        : 'Enregistrement impossible.');
      setSubmitting(false);
    }
  }

  return (
    <form className="card card--elevated admin-form" onSubmit={(e): void => { void handleSubmit(e); }}>
      <div className="admin-form__head">
        <h2 className="admin-form__title">Nouveau contact — {company.name}</h2>
        <button type="button" className="btn btn--ghost btn--icon" onClick={onCancel} aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {formError !== null ? <p role="alert" className="alert alert--bad">{formError}</p> : null}

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="ct-fn" className="field-group__label">Prénom</label>
          <input id="ct-fn" className="field" value={firstName} required
            onChange={(e): void => { setFirstName(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="ct-ln" className="field-group__label">Nom</label>
          <input id="ct-ln" className="field" value={lastName} required
            onChange={(e): void => { setLastName(e.target.value); }} />
        </div>
      </div>
      <div className="field-row">
        <div className="field-group">
          <label htmlFor="ct-em" className="field-group__label">Email</label>
          <input id="ct-em" type="email" className="field" value={email} required
            onChange={(e): void => { setEmail(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="ct-pw" className="field-group__label">Mot de passe</label>
          <input id="ct-pw" type="password" className="field" value={password} required minLength={6}
            onChange={(e): void => { setPassword(e.target.value); }} />
        </div>
      </div>

      <div className="admin-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer le contact'}
        </button>
      </div>
    </form>
  );
}

/* ================= Équipe & partenaires ================= */

function TeamSection(): React.ReactElement {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<ReadonlyArray<ApiManagedUser>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiManagedUser | 'new' | null>(null);
  const [tick, setTick] = useState(0);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    listUsers()
      .then((all) => {
        if (!state.cancelled) {
          // Les comptes CLIENT sont gérés dans l'onglet Entreprises.
          setUsers(all.filter((u) => u.role !== 'CLIENT'));
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erreur de chargement.');
        }
      })
      .finally(() => { if (!state.cancelled) setLoading(false); });
    return (): void => { state.cancelled = true; };
  }, [tick]);

  const reload = (): void => { setTick((t) => t + 1); };

  async function handleDelete(user: ApiManagedUser): Promise<void> {
    if (!window.confirm(`Supprimer le compte de ${user.firstName} ${user.lastName} (${user.email}) ?`)) {
      return;
    }
    try {
      await deleteUser(user.id);
      reload();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  async function handleToggleActive(user: ApiManagedUser): Promise<void> {
    try {
      await updateUserFlags(user.id, { active: !user.active });
      reload();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour impossible.');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--accent btn--sm"
          onClick={(): void => { setEditing('new'); }}>
          <Icon name="plus" size={14} /> Nouveau compte
        </button>
      </div>

      {error !== null ? <p role="alert" className="alert alert--bad">{error}</p> : null}

      {editing !== null ? (
        <UserForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onCancel={(): void => { setEditing(null); }}
          onSaved={(): void => { setEditing(null); reload(); }}
        />
      ) : null}

      {loading ? (
        <p className="empty-state">Chargement…</p>
      ) : (
        <div className="doc-table-wrap">
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={teamThStyle}>Compte</th>
                <th style={teamThStyle}>Rôle</th>
                <th style={teamThStyle}>Région</th>
                <th style={{ ...teamThStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = currentUser !== null && currentUser.id === user.id;
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--line)', opacity: user.active ? 1 : 0.55 }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 500 }}>
                        {user.firstName} {user.lastName}
                        {!user.active ? <span className="tag" style={{ marginLeft: '0.5rem', color: 'var(--bad)' }}>Désactivé</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '0.9rem 0.75rem' }}>
                      <span className={`role-badge role-badge--${user.role}`}>
                        {ROLE_BADGE_LABEL[user.role]}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 0.75rem', fontSize: 13, color: 'var(--ink-mute)' }}>
                      {user.region ?? '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <label className="radio-chip"
                        title={isSelf ? 'Vous ne pouvez pas désactiver votre propre compte.' : 'Autoriser la connexion'}>
                        <input
                          type="checkbox"
                          checked={user.active}
                          disabled={isSelf}
                          onChange={(): void => { void handleToggleActive(user); }}
                        />
                        Connexion
                      </label>{' '}
                      <button type="button" className="btn btn--ghost btn--sm"
                        onClick={(): void => { setEditing(user); }}>
                        <Icon name="edit" size={14} /> Modifier
                      </button>{' '}
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={isSelf}
                        title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte.' : undefined}
                        onClick={(): void => { void handleDelete(user); }}>
                        <Icon name="trash" size={14} /> Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const teamThStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 1.25rem',
  background: 'var(--paper-2)',
  borderBottom: '1px solid var(--line)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-mute)',
  fontWeight: 500,
};

interface UserFormProps {
  initial: ApiManagedUser | null;
  onSaved: () => void;
  onCancel: () => void;
}

function UserForm({ initial, onSaved, onCancel }: UserFormProps): React.ReactElement {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [role, setRole] = useState<UserRoleT>(initial?.role ?? UserRole.EMPLOYEE);
  const [region, setRegion] = useState(initial?.region ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload: ManagedUserInput = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      region: region.trim() === '' ? null : region.trim(),
      password: password === '' ? null : password,
    };
    try {
      if (initial === null) {
        await createUser(payload);
      } else {
        await updateUser(initial.id, payload);
      }
      onSaved();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError
        ? (err.violations.length > 0 ? err.violations.map((v) => v.message).join(' ') : err.message)
        : 'Enregistrement impossible.');
      setSubmitting(false);
    }
  }

  return (
    <form className="card card--elevated admin-form" onSubmit={(e): void => { void handleSubmit(e); }}>
      <div className="admin-form__head">
        <h2 className="admin-form__title">
          {initial === null ? 'Nouveau compte' : `Modifier ${initial.firstName} ${initial.lastName}`}
        </h2>
        <button type="button" className="btn btn--ghost btn--icon" onClick={onCancel} aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {formError !== null ? <p role="alert" className="alert alert--bad">{formError}</p> : null}

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="u-fn" className="field-group__label">Prénom</label>
          <input id="u-fn" className="field" value={firstName} required
            onChange={(e): void => { setFirstName(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="u-ln" className="field-group__label">Nom</label>
          <input id="u-ln" className="field" value={lastName} required
            onChange={(e): void => { setLastName(e.target.value); }} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="u-em" className="field-group__label">Email</label>
          <input id="u-em" type="email" className="field" value={email} required
            onChange={(e): void => { setEmail(e.target.value); }} />
        </div>
        <div className="field-group">
          <label htmlFor="u-role" className="field-group__label">Rôle</label>
          <select id="u-role" className="field-select" value={role}
            onChange={(e): void => { setRole(e.target.value as UserRoleT); }}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_BADGE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="u-region" className="field-group__label">Région (optionnel)</label>
          <input id="u-region" className="field" value={region}
            onChange={(e): void => { setRegion(e.target.value); }} placeholder="Île-de-France" />
        </div>
        <div className="field-group">
          <label htmlFor="u-pw" className="field-group__label">
            {initial === null ? 'Mot de passe' : 'Nouveau mot de passe (laisser vide pour conserver)'}
          </label>
          <input id="u-pw" type="password" className="field" value={password}
            required={initial === null} minLength={6} autoComplete="new-password"
            onChange={(e): void => { setPassword(e.target.value); }} />
        </div>
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

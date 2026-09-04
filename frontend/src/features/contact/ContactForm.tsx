import type React from 'react';
import { useState } from 'react';
import { submitContactRequest } from '@/api/contact';
import { ApiError } from '@/api/client';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import type { ContactRequestInput } from '@/types/api';
import { ProjectType } from '@/types/enums';
import type { ProjectType as ProjectTypeT } from '@/types/enums';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectTypeT | '';
  segment: string;
  surface: string;
  deadline: string;
  message: string;
}

const EMPTY: FormState = {
  fullName: '',
  email: '',
  phone: '',
  postalCode: '',
  projectType: '',
  segment: '',
  surface: '',
  deadline: '',
  message: '',
};

interface ProjectTypeCard {
  id: ProjectTypeT;
  label: string;
  icon: IconName;
}

const PROJECT_TYPES: ReadonlyArray<ProjectTypeCard> = [
  { id: ProjectType.INSTALLATION_AC, label: 'Climatisation', icon: 'snow' },
  { id: ProjectType.HEAT_PUMP, label: 'Pompe à chaleur', icon: 'sun' },
  { id: ProjectType.VMC, label: 'VMC', icon: 'wind' },
  { id: ProjectType.MAINTENANCE, label: 'Entretien', icon: 'tools' },
  { id: ProjectType.REPAIR, label: 'Dépannage', icon: 'bolt' },
];

const SEGMENTS: ReadonlyArray<string> = [
  'Particulier',
  'Tertiaire / bureaux',
  'Industriel',
  'Bailleur / syndic',
];

const TIMEFRAMES: ReadonlyArray<string> = [
  'Urgent (< 2 semaines)',
  'Sous 1 mois',
  'Sous 3 mois',
  'À planifier (6+ mois)',
];

function validateClient(s: FormState): Map<string, string> {
  const errs = new Map<string, string>();
  if (s.fullName.trim().length < 2) errs.set('fullName', 'Nom requis (2 caractères minimum).');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) errs.set('email', 'Email invalide ou obligatoire.');
  if (s.phone.replace(/\s/g, '').length < 6) errs.set('phone', 'Téléphone obligatoire.');
  if (!/^\d{5}$/.test(s.postalCode)) errs.set('postalCode', 'Code postal obligatoire (5 chiffres).');
  if (s.projectType === '') errs.set('projectType', 'Type de projet obligatoire.');
  if (s.message.trim().length < 5) errs.set('message', 'Message obligatoire (5 caractères minimum).');
  return errs;
}

function deadlineFromTimeframe(label: string): string | null {
  const now = new Date();
  switch (label) {
    case 'Urgent (< 2 semaines)':
      now.setDate(now.getDate() + 14);
      break;
    case 'Sous 1 mois':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'Sous 3 mois':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'À planifier (6+ mois)':
      now.setMonth(now.getMonth() + 6);
      break;
    default:
      return null;
  }
  return now.toISOString().slice(0, 10);
}

export function ContactForm(): React.ReactElement {
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  async function performSubmit(): Promise<void> {
    setSubmitting(true);
    try {
      const input: ContactRequestInput = {
        fullName: state.fullName.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        postalCode: state.postalCode.trim(),
        projectType: state.projectType as ProjectTypeT,
        message: state.message.trim(),
        surface: state.surface === '' ? null : Number.parseInt(state.surface, 10),
        deadline: state.deadline === '' ? deadlineFromTimeframe(state.deadline) : state.deadline,
      };
      await submitContactRequest(input);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.violations.length > 0) {
          const map = new Map<string, string>();
          for (const v of err.violations) map.set(v.propertyPath, v.message);
          setErrors(map);
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Erreur réseau, veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setServerError(null);
    const clientErrs = validateClient(state);
    if (clientErrs.size > 0) {
      setErrors(clientErrs);
      return;
    }
    setErrors(new Map());
    void performSubmit();
  };

  if (success) {
    const projectLabel = PROJECT_TYPES.find((p) => p.id === state.projectType)?.label ?? '—';
    return (
      <div>
        <p className="alert alert--ok" role="status">
          Demande envoyée. Un chargé d&apos;études vous rappelle sous 72 h ouvrées.
        </p>
        <div className="card contact-success__card" style={{ background: 'var(--paper-2)' }}>
          <div className="aside-card__label">Récapitulatif</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.5rem', fontSize: 14 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-mute)' }}>Projet</span><span>{projectLabel}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-mute)' }}>Segment</span><span>{state.segment === '' ? '—' : state.segment}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-mute)' }}>Code postal</span><span className="num">{state.postalCode === '' ? '—' : state.postalCode}</span>
            </li>
          </ul>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ marginTop: '2rem' }}
          onClick={(): void => {
            setState(EMPTY);
            setSuccess(false);
          }}
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {serverError !== null ? (
        <p role="alert" className="alert alert--bad">{serverError}</p>
      ) : null}

      <fieldset className="fieldset">
        <legend className="fieldset__legend">01 — Type de projet</legend>
        <div className="choice-grid">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={(): void => {
                update('projectType', t.id);
              }}
              className={`choice-card ${state.projectType === t.id ? 'is-active' : ''}`}
            >
              <Icon name={t.icon} size={20} className="choice-card__icon" />
              <span className="choice-card__label">{t.label}</span>
            </button>
          ))}
        </div>
        {errors.has('projectType') ? (
          <span role="alert" className="error-msg">{errors.get('projectType')}</span>
        ) : null}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">02 — Vous êtes</legend>
        <div className="pill-row">
          {SEGMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(): void => {
                update('segment', s);
              }}
              className={`pill ${state.segment === s ? 'is-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">03 — Caractéristiques</legend>
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="surface" className="field-group__label">Surface (m²)</label>
            <input
              id="surface"
              type="text"
              inputMode="numeric"
              className="field"
              placeholder="ex. 120"
              value={state.surface}
              onChange={(e): void => {
                update('surface', e.target.value);
              }}
            />
          </div>
          <div className="field-group">
            <label htmlFor="postalCode" className="field-group__label">Code postal</label>
            <input
              id="postalCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              className="field"
              placeholder="ex. 69009"
              value={state.postalCode}
              onChange={(e): void => {
                update('postalCode', e.target.value);
              }}
            />
            {errors.has('postalCode') ? (
              <span role="alert" className="error-msg">{errors.get('postalCode')}</span>
            ) : null}
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <span className="field-group__label">Échéance souhaitée</span>
          <div className="pill-row" style={{ marginTop: '0.5rem' }}>
            {TIMEFRAMES.map((t) => {
              const iso = deadlineFromTimeframe(t) ?? '';
              const active = state.deadline === iso && iso !== '';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={(): void => {
                    update('deadline', iso);
                  }}
                  className={`pill pill--rect ${active ? 'is-active' : ''}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">04 — Vos coordonnées</legend>
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fullName" className="field-group__label">Nom complet</label>
            <input
              id="fullName"
              type="text"
              required
              className="field"
              value={state.fullName}
              onChange={(e): void => {
                update('fullName', e.target.value);
              }}
            />
            {errors.has('fullName') ? (
              <span role="alert" className="error-msg">{errors.get('fullName')}</span>
            ) : null}
          </div>
          <div className="field-group">
            <label htmlFor="email" className="field-group__label">Email</label>
            <input
              id="email"
              type="email"
              required
              className="field"
              value={state.email}
              onChange={(e): void => {
                update('email', e.target.value);
              }}
            />
            {errors.has('email') ? (
              <span role="alert" className="error-msg">{errors.get('email')}</span>
            ) : null}
          </div>
        </div>
        <div className="field-group" style={{ marginTop: '1rem' }}>
          <label htmlFor="phone" className="field-group__label">Téléphone</label>
          <input
            id="phone"
            type="tel"
            className="field"
            value={state.phone}
            onChange={(e): void => {
              update('phone', e.target.value);
            }}
          />
          {errors.has('phone') ? (
            <span role="alert" className="error-msg">{errors.get('phone')}</span>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">05 — Votre besoin</legend>
        <label htmlFor="message" className="sr-only">Message</label>
        <textarea
          id="message"
          rows={5}
          className="field"
          placeholder="Quelques précisions sur votre logement, votre bâtiment ou votre attente…"
          value={state.message}
          onChange={(e): void => {
            update('message', e.target.value);
          }}
        />
        {errors.has('message') ? (
          <span role="alert" className="error-msg">{errors.get('message')}</span>
        ) : null}
      </fieldset>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem' }}>
        <span className="help-text">
          <Icon name="lock" size={12} /> Vos données sont chiffrées et utilisées uniquement pour répondre à votre demande.
        </span>
        <button type="submit" className="btn btn--accent btn--lg" disabled={submitting}>
          {submitting ? 'Envoi…' : (
            <>
              Envoyer ma demande <Icon name="arrow-right" size={14} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

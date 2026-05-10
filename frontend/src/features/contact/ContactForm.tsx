import type React from 'react';
import { useState } from 'react';
import { submitContactRequest } from '@/api/contact';
import { ApiError } from '@/api/client';
import type { ContactRequestInput } from '@/types/api';
import { ProjectType } from '@/types/enums';
import type { ProjectType as ProjectTypeT } from '@/types/enums';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectTypeT | '';
  surface: string;
  deadline: string;
  message: string;
}

const EMPTY: FormState = {
  fullName: '', email: '', phone: '', postalCode: '', projectType: '', surface: '', deadline: '', message: '',
};

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

export function ContactForm(): React.ReactElement {
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
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
        deadline: state.deadline === '' ? null : state.deadline,
      };
      await submitContactRequest(input);
      setSuccess('Merci, votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.');
      setState(EMPTY);
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
    setSuccess(null);
    const clientErrs = validateClient(state);
    if (clientErrs.size > 0) {
      setErrors(clientErrs);
      return;
    }
    setErrors(new Map());
    void performSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby="contact-status">
      <p id="contact-status" role="status">{success ?? ''}</p>
      {serverError !== null ? <p role="alert">{serverError}</p> : null}

      <p>
        <label htmlFor="fullName">Nom complet</label><br />
        <input id="fullName" value={state.fullName} onChange={(e): void => { update('fullName', e.target.value); }} />
        {errors.has('fullName') ? <span role="alert">{errors.get('fullName')}</span> : null}
      </p>
      <p>
        <label htmlFor="email">Email</label><br />
        <input id="email" type="email" value={state.email} onChange={(e): void => { update('email', e.target.value); }} />
        {errors.has('email') ? <span role="alert">{errors.get('email')}</span> : null}
      </p>
      <p>
        <label htmlFor="phone">Téléphone</label><br />
        <input id="phone" value={state.phone} onChange={(e): void => { update('phone', e.target.value); }} />
        {errors.has('phone') ? <span role="alert">{errors.get('phone')}</span> : null}
      </p>
      <p>
        <label htmlFor="postalCode">Code postal</label><br />
        <input id="postalCode" value={state.postalCode} onChange={(e): void => { update('postalCode', e.target.value); }} />
        {errors.has('postalCode') ? <span role="alert">{errors.get('postalCode')}</span> : null}
      </p>
      <p>
        <label htmlFor="projectType">Type de projet</label><br />
        <select id="projectType" value={state.projectType} onChange={(e): void => { update('projectType', e.target.value as ProjectTypeT | ''); }}>
          <option value="">— Sélectionner —</option>
          <option value={ProjectType.INSTALLATION_AC}>Installation climatisation</option>
          <option value={ProjectType.HEAT_PUMP}>Pompe à chaleur</option>
          <option value={ProjectType.VMC}>VMC</option>
          <option value={ProjectType.MAINTENANCE}>Entretien</option>
          <option value={ProjectType.REPAIR}>Dépannage</option>
        </select>
        {errors.has('projectType') ? <span role="alert">{errors.get('projectType')}</span> : null}
      </p>
      <p>
        <label htmlFor="surface">Surface (m²) — optionnel</label><br />
        <input id="surface" type="number" min="1" value={state.surface} onChange={(e): void => { update('surface', e.target.value); }} />
      </p>
      <p>
        <label htmlFor="deadline">Échéance souhaitée — optionnel</label><br />
        <input id="deadline" type="date" value={state.deadline} onChange={(e): void => { update('deadline', e.target.value); }} />
      </p>
      <p>
        <label htmlFor="message">Message</label><br />
        <textarea id="message" rows={5} value={state.message} onChange={(e): void => { update('message', e.target.value); }} />
        {errors.has('message') ? <span role="alert">{errors.get('message')}</span> : null}
      </p>
      <button type="submit" disabled={submitting}>{submitting ? 'Envoi…' : 'Envoyer la demande'}</button>
    </form>
  );
}

import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { SectionLabel } from '@/components/SectionLabel';
import { LoginForm } from '@/features/auth/LoginForm';

interface DemoAccount {
  tag: string;
  email: string;
  description: string;
}

const DEMO_ACCOUNTS: ReadonlyArray<DemoAccount> = [
  {
    tag: 'Employé · Technicien',
    email: 'employe.idf@climalia.fr',
    description: 'Plannings, fiches techniques, contrats clients assignés, formations.',
  },
  {
    tag: 'Partenaire · Syndic',
    email: 'syndic@partner.fr',
    description: "Rapports d'intervention, certificats, factures, contrats de maintenance.",
  },
  {
    tag: 'Administrateur',
    email: 'admin@climalia.fr',
    description: "Vue complète, gestion des utilisateurs et de l'organisation.",
  },
  {
    tag: 'Éditeur · Contenu',
    email: 'editor@climalia.fr',
    description: 'Gestion éditoriale : contenu des pages et réalisations.',
  },
];

export function LoginPage(): React.ReactElement {
  const [prefill, setPrefill] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [version, setVersion] = useState(0);

  const fill = (email: string): void => {
    setPrefill({ email, password: 'demo' });
    setVersion((v) => v + 1);
  };

  return (
    <div className="login">
      <div className="login__pane">
        <Link to="/" className="login__back">
          <Icon name="arrow-right" size={14} style={{ transform: 'rotate(180deg)' }} />
          Retour au site
        </Link>

        <div className="login__form-wrap">
          <Logo size={26} />
          <div style={{ marginTop: '3rem' }}>
            <SectionLabel num="·" accent>Espace pro</SectionLabel>
            <h1 className="login__title">Bon retour parmi nous.</h1>
            <p className="login__sub">
              Accédez à vos plannings, contrats, rapports et factures.
            </p>
          </div>

          <LoginForm
            key={version}
            initialEmail={prefill.email}
            initialPassword={prefill.password}
          />

          <div className="login__foot">
            Connexion sécurisée — chiffrée AES-256, conforme RGPD.
          </div>
        </div>
      </div>

      <aside className="login__panel">
        <div className="login__panel-stripes" aria-hidden />
        <div className="login__panel-inner">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Démonstration
          </div>
          <h2 className="login__panel-title">Trois comptes pour explorer.</h2>
          <p style={{ marginTop: '1rem', fontSize: 14 }}>
            Cliquez sur un compte pour pré-remplir le formulaire. Mot de passe : <code>demo</code>
          </p>

          <div className="login__demo-list">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="login__demo-card"
                onClick={(): void => {
                  fill(acc.email);
                }}
              >
                <div className="login__demo-card-row">
                  <div>
                    <div className="login__demo-tag">{acc.tag}</div>
                    <div className="login__demo-email">{acc.email}</div>
                    <div className="login__demo-desc">{acc.description}</div>
                  </div>
                  <Icon name="arrow-up-right" size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '3rem', fontSize: 12, opacity: 0.5 }}>
            Cet espace est réservé aux collaborateurs et partenaires Climalia.
          </div>
        </div>
      </aside>
    </div>
  );
}

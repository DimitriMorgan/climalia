import type React from 'react';
import { ContactForm } from '@/features/contact/ContactForm';

export function ContactPage(): React.ReactElement {
  return (
    <section>
      <h1>Demande de devis</h1>
      <p>Remplissez le formulaire — nous revenons vers vous sous 48 h.</p>
      <ContactForm />
    </section>
  );
}

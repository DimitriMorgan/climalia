import type React from 'react';
import { ServiceList } from '@/features/services/ServiceList';

export function ServicesPage(): React.ReactElement {
  return (
    <section>
      <h1>Nos services</h1>
      <ServiceList />
    </section>
  );
}

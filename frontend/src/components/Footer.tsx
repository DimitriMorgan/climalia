import type React from 'react';

export function Footer(): React.ReactElement {
  return (
    <footer
      style={{ padding: '1rem', borderTop: '1px solid #ccc', marginTop: '2rem', color: '#666' }}
    >
      <p>Climalia — Artisan climaticien — France entière — RGE / QualiPAC</p>
    </footer>
  );
}

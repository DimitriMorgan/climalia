import type React from 'react';
import { Fragment } from 'react';

interface RichTextProps {
  /** Texte au mini-format contenu : `*segment*` → <em>, `\n` → <br/>. */
  text: string;
}

/**
 * Rend une valeur de clé de contenu : les segments entre astérisques passent
 * en <em> (stylé couleur accent par les titres), les retours à la ligne
 * deviennent des <br/>. Aucun HTML n'est interprété.
 */
export function RichText({ text }: RichTextProps): React.ReactElement {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={`l-${String(li)}`}>
          {li > 0 ? <br /> : null}
          {line.split('*').map((seg, si) =>
            seg === '' ? null : si % 2 === 1 ? (
              <em key={`s-${String(si)}`}>{seg}</em>
            ) : (
              <Fragment key={`s-${String(si)}`}>{seg}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

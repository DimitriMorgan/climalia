import type React from 'react';
import { useState } from 'react';

export type SlotTone = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
export type SlotRatio = '4-3' | '4-5' | '1-1';

interface StripedSlotProps {
  tone?: SlotTone;
  ratio?: SlotRatio;
  caption?: string;
  className?: string;
  /** Unsplash photo id fragment, e.g. "photo-1776860153678-b204dccd0f65". When set, displays the photo and hides stripes. */
  photo?: string | undefined;
  /**
   * Direct image URL (uploaded editorial media, e.g. "/uploads/<uuid>.jpg", or any
   * absolute URL). Takes precedence over `photo`. If it fails to load, we fall back
   * to `photo` (Unsplash) when available, otherwise to the striped placeholder.
   */
  src?: string | null | undefined;
  /** Width hint for Unsplash auto-format. */
  photoWidth?: number | undefined;
  /** Alt text for the rendered photo. */
  photoAlt?: string | undefined;
  children?: React.ReactNode;
}

export function StripedSlot({
  tone = 'a',
  ratio = '4-3',
  caption,
  className = '',
  photo,
  src,
  photoWidth = 1200,
  photoAlt = '',
  children,
}: StripedSlotProps): React.ReactElement {
  const [srcFailed, setSrcFailed] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(src);

  // Réinitialise le fallback quand l'URL change (pattern « ajuster l'état au
  // rendu » recommandé par React, plutôt qu'un effet) : sinon une instance
  // réutilisée resterait bloquée sur le placeholder après un échec précédent.
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setSrcFailed(false);
  }

  const directUrl =
    src !== undefined && src !== null && src !== '' && !srcFailed ? src : undefined;
  const unsplashUrl =
    photo === undefined
      ? undefined
      : `https://images.unsplash.com/${photo}?w=${String(photoWidth)}&q=80&auto=format&fit=crop`;
  const photoUrl = directUrl ?? unsplashUrl;

  const cls = `slot ${photoUrl === undefined ? `slot--${tone}` : 'slot--photo'} slot--ratio-${ratio} ${className}`.trim();

  return (
    <div className={cls}>
      {photoUrl !== undefined ? (
        <img
          src={photoUrl}
          alt={photoAlt}
          loading="lazy"
          className="slot__img"
          onError={
            directUrl !== undefined
              ? (): void => {
                  setSrcFailed(true);
                }
              : undefined
          }
        />
      ) : null}
      {caption !== undefined ? <span className="slot__caption">{caption}</span> : null}
      {children}
    </div>
  );
}

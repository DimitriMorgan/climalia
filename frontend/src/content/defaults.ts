/**
 * Textes par défaut du site vitrine, adressés par clé (« clés de traduction »).
 *
 * L'admin (« Contenu du site », espace pro) permet d'overrider chaque clé ;
 * les overrides sont stockés côté API (`/api/content`) et appliqués par-dessus
 * ces valeurs. Une clé absente des overrides retombe sur le défaut ci-dessous,
 * donc zéro régression tant que rien n'est modifié.
 *
 * Mini-format des valeurs (rendu par <RichText />) :
 *  - `*texte*`  → segment accentué (couleur accent)
 *  - retour à la ligne → passage à la ligne
 */
export const CONTENT_DEFAULTS = {
  // ---- Accueil ----
  'home.hero.label': 'Climaticien — France entière',
  'home.hero.title': 'Le confort thermique,\n*posé proprement*,\npartout en France.',
  'home.hero.lede':
    "Climatisation, pompes à chaleur et VMC pour particuliers, tertiaire et industrie. Une équipe de 240 frigoristes, un standard d'exécution constant, des aides à la rénovation accompagnées.",
  'home.hero.cta': 'Obtenir un devis gratuit',
  'home.hero.cta2': 'Voir nos prestations',
  'home.hero.photo.caption': 'Installation PAC air-eau · Versailles',
  'home.hero.chip.title': 'Étude thermique',
  'home.hero.chip.text': 'Bilan personnalisé sous 72 h, sans engagement.',
  'home.services.label': 'Nos métiers',
  'home.services.title': 'Cinq expertises, un seul interlocuteur.',
  'home.services.link': 'Voir tous les services',
  'home.testimonials.label': 'Ils ont choisi Climalia',
  'home.testimonials.title': 'Des chantiers *aux quatre coins* du pays.',
  'home.projects.label': 'Réalisations récentes',
  'home.projects.title': 'Quelques chantiers récents.',
  'home.projects.link': 'Toute la galerie',
  'home.cta.eyebrow': 'Prêts à commencer ?',
  'home.cta.title': 'Recevez votre étude\nthermique sous *72 heures*.',
  'home.cta.button': 'Démarrer mon projet',
  'home.cta.phone': '09 70 12 04 04 — du lundi au vendredi',

  // ---- Services ----
  'services.hero.label': 'Prestations',
  'services.hero.title': "Tout l'écosystème *thermique*, sous un seul toit.",
  'services.hero.lede':
    "De l'étude thermique à l'entretien annuel, Climalia maîtrise toute la chaîne de valeur. Pour les particuliers, le tertiaire et l'industrie.",

  // ---- Réalisations ----
  'realizations.hero.label': 'Réalisations',
  'realizations.hero.title': 'chantiers, *une dizaine de régions*.',
  'realizations.hero.lede':
    "Galerie filtrable de nos installations récentes. Chaque projet a fait l'objet d'une étude thermique dédiée et d'un suivi de mise en service.",

  // ---- À propos ----
  'about.hero.label': 'À propos',
  'about.hero.title': "Rendre le génie climatique *aussi soigné* qu'une menuiserie d'art.",
  'about.hero.lede':
    "Climalia est née d'une conviction simple : la qualité de pose vaut autant que la qualité de l'équipement. Depuis 2014, nous construisons une équipe de frigoristes triés sur le volet, et un réseau d'artisans partenaires qui partagent ce niveau d'exigence.",

  // ---- Contact ----
  'contact.hero.label': 'Devis & contact',
  'contact.hero.title': 'Décrivez votre projet, on vous rappelle.',
  'contact.phone.label': 'Standard national',
  'contact.phone.number': '09 70 12 04 04',
  'contact.phone.hours': 'Du lundi au vendredi de 8h à 19h, samedi 9h-13h. Astreinte dépannage 24/7.',
  'contact.email': 'contact@climalia.fr',

  // ---- Pied de page ----
  'footer.tagline':
    "Climalia conçoit, installe et entretient vos systèmes de climatisation, pompes à chaleur et VMC. Présent dans 96 départements, avec un standard d'exécution constant.",
  'footer.phone': '09 70 12 04 04',
  'footer.email': 'contact@climalia.fr',
  'footer.address': "Siège — 14 rue d'Auvergne, 69009 Lyon",
  'footer.legal': 'Climalia SAS — RCS Lyon 803 124 502 — TVA FR 12 803124502',
} as const satisfies Record<string, string>;

export type ContentKey = keyof typeof CONTENT_DEFAULTS;

export const CONTENT_KEYS: ReadonlyArray<ContentKey> = Object.keys(
  CONTENT_DEFAULTS,
) as ReadonlyArray<ContentKey>;

/** Libellés des groupes de clés (préfixe avant le premier point) pour l'admin. */
export const CONTENT_GROUP_LABELS: Readonly<Record<string, string>> = {
  home: 'Accueil',
  services: 'Services',
  realizations: 'Réalisations',
  about: 'À propos',
  contact: 'Contact',
  footer: 'Pied de page',
};

export function contentGroupOf(key: ContentKey): string {
  return key.split('.')[0] ?? 'autre';
}

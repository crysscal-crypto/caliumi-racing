import { buildLegacyTheme } from 'sanity'

// Tema dello Studio con i colori di Caliumi Racing: fibra di carbonio scura, giallo e rosso racing
const colori = {
  nero: '#0d0f12',
  carbonio: '#15181d',
  grigio: '#8a9099',
  bianco: '#f2f2f2',
  giallo: '#ffd400',
  rosso: '#e10600',
  verde: '#2fbf71',
  arancio: '#ff9f1a',
}

export const temaCaliumi = buildLegacyTheme({
  '--black': colori.nero,
  '--white': colori.bianco,
  '--gray': colori.grigio,
  '--gray-base': colori.grigio,

  '--component-bg': colori.carbonio,
  '--component-text-color': colori.bianco,

  '--brand-primary': colori.giallo,

  '--default-button-color': colori.grigio,
  '--default-button-primary-color': colori.giallo,
  '--default-button-success-color': colori.verde,
  '--default-button-warning-color': colori.arancio,
  '--default-button-danger-color': colori.rosso,

  '--state-info-color': colori.giallo,
  '--state-success-color': colori.verde,
  '--state-warning-color': colori.arancio,
  '--state-danger-color': colori.rosso,

  '--main-navigation-color': colori.nero,
  '--main-navigation-color--inverted': colori.bianco,

  '--focus-color': colori.giallo,
})

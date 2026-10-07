import { defineField, defineType } from 'sanity'

const testo = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: 'string', description, group: 'tecnica' })

export default defineType({
  name: 'moto',
  title: 'Le mie moto',
  type: 'document',
  groups: [
    { name: 'generale', title: 'Generale', default: true },
    { name: 'tecnica', title: 'Scheda tecnica' },
  ],
  fields: [
    defineField({ name: 'nome', title: 'Nome moto (es. Honda RS 250)', type: 'string', group: 'generale', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Indirizzo pagina', type: 'slug', group: 'generale', options: { source: 'nome' }, validation: (R) => R.required() }),
    defineField({ name: 'annoInizio', title: 'Anno (dal)', type: 'number', group: 'generale', validation: (R) => R.required() }),
    defineField({ name: 'annoFine', title: 'Anno (al) – lascia vuoto se una sola stagione', type: 'number', group: 'generale' }),
    defineField({ name: 'campionati', title: 'Campionati', type: 'string', group: 'generale' }),
    defineField({ name: 'team', title: 'Team / preparatore', type: 'string', group: 'generale' }),
    defineField({ name: 'riassunto', title: 'Riassunto (per Google, 1-2 frasi)', type: 'text', rows: 2, group: 'generale' }),
    defineField({ name: 'racconto', title: 'Il mio racconto', type: 'text', rows: 8, group: 'generale' }),
    defineField({
      name: 'foto',
      title: 'Foto principale',
      type: 'image',
      group: 'generale',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' })],
    }),
    defineField({
      name: 'altreFoto',
      title: 'Altre foto della moto',
      description: 'Trascina qui quante foto vuoi: compaiono nella pagina della moto, ingrandibili.',
      type: 'array',
      group: 'generale',
      options: { layout: 'grid' },
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' }),
            defineField({ name: 'didascalia', title: 'Didascalia (facoltativa)', type: 'string' }),
          ],
        },
      ],
    }),
    testo('motore', 'Motore'),
    testo('cilindrata', 'Cilindrata'),
    testo('alesaggioCorsa', 'Alesaggio x corsa'),
    testo('potenza', 'Potenza'),
    testo('coppia', 'Coppia'),
    testo('alimentazione', 'Alimentazione'),
    testo('raffreddamento', 'Raffreddamento'),
    testo('cambio', 'Cambio'),
    testo('telaio', 'Telaio'),
    testo('sospAnt', 'Sospensione anteriore'),
    testo('sospPost', 'Sospensione posteriore'),
    testo('freni', 'Freni'),
    testo('pneumatici', 'Pneumatici / cerchi'),
    testo('peso', 'Peso'),
    testo('velocita', 'Velocità massima'),
    defineField({
      name: 'notaDati',
      title: 'Nota sui dati',
      type: 'string',
      group: 'tecnica',
      description: 'Es: "Dati della versione stradale di serie" oppure "Dati misurati al banco"',
    }),
  ],
  orderings: [{ title: 'Anno', name: 'anno', by: [{ field: 'annoInizio', direction: 'asc' }] }],
  preview: {
    select: { title: 'nome', a: 'annoInizio', b: 'annoFine', media: 'foto' },
    prepare: ({ title, a, b, media }) => ({ title, subtitle: b && b !== a ? `${a}–${b}` : `${a ?? ''}`, media }),
  },
})

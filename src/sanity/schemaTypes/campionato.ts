import { defineArrayMember, defineField, defineType } from 'sanity'

const CATEGORIE = [
  { title: 'Trofeo Gilera', value: 'trofeo-gilera' },
  { title: 'Sport Production', value: 'sport-production' },
  { title: 'Campionato Italiano GP', value: 'gp-italiano' },
  { title: 'Campionato Italiano 125cc', value: 'gp-italiano-125' },
  { title: 'Campionato Italiano 250cc', value: 'gp-italiano-250' },
  { title: 'Campionato Europeo GP', value: 'gp-europeo' },
  { title: 'Campionato Europeo 125cc', value: 'gp-europeo-125' },
  { title: 'Campionato Europeo 250cc', value: 'gp-europeo-250' },
  { title: 'Motomondiale', value: 'motomondiale' },
  { title: 'Superbike', value: 'superbike' },
  { title: 'Superstock', value: 'superstock' },
]

export default defineType({
  name: 'campionato',
  title: 'Campionati',
  type: 'document',
  fields: [
    defineField({ name: 'nome', title: 'Nome', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Indirizzo pagina', type: 'slug', options: { source: 'nome' }, validation: (R) => R.required() }),
    defineField({ name: 'sottotitolo', title: 'Sottotitolo', type: 'string' }),
    defineField({ name: 'periodo', title: 'Periodo (es. 1988–1992)', type: 'string' }),
    defineField({ name: 'ordine', title: 'Ordine nell\'elenco (1 = primo)', type: 'number' }),
    defineField({
      name: 'categorie',
      title: 'Categorie collegate (per mostrare articoli e foto)',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: CATEGORIE },
    }),
    defineField({ name: 'riassunto', title: 'Riassunto (per Google, 1-2 frasi)', type: 'text', rows: 2 }),
    defineField({
      name: 'foto',
      title: 'Foto principale',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' })],
    }),
    defineField({
      name: 'sezioni',
      title: 'Sezioni del testo',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sezione',
          fields: [
            defineField({ name: 'titolo', title: 'Titolo', type: 'string' }),
            defineField({ name: 'testo', title: 'Testo (riga vuota = nuovo paragrafo, riga che inizia con "- " = elenco)', type: 'text', rows: 8 }),
          ],
          preview: { select: { title: 'titolo' } },
        }),
      ],
    }),
    defineField({ name: 'esperienza', title: 'La mia esperienza', type: 'text', rows: 6 }),
    defineField({
      name: 'alboDoro',
      title: "Albo d'oro",
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'vincitore',
          fields: [
            defineField({ name: 'anno', title: 'Anno', type: 'number' }),
            defineField({ name: 'moto', title: 'Moto', type: 'string' }),
            defineField({ name: 'pilota', title: 'Vincitore', type: 'string' }),
          ],
          preview: {
            select: { anno: 'anno', pilota: 'pilota', moto: 'moto' },
            prepare: ({ anno, pilota, moto }) => ({ title: `${anno ?? ''} – ${pilota ?? ''}`, subtitle: moto }),
          },
        }),
      ],
    }),
    defineField({
      name: 'moto',
      title: 'Le mie moto in questo campionato',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'moto' }] })],
    }),
  ],
  orderings: [{ title: 'Ordine', name: 'ordine', by: [{ field: 'ordine', direction: 'asc' }] }],
  preview: { select: { title: 'nome', subtitle: 'periodo', media: 'foto' } },
})

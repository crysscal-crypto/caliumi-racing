import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'articolo',
  title: 'Articolo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug URL',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Campionato',
      type: 'string',
      options: {
        list: [
          { title: 'Trofeo Gilera', value: 'trofeo-gilera' },
          { title: 'Sport Production', value: 'sport-production' },
          { title: 'Campionato Italiano GP', value: 'gp-italiano' },
          { title: 'Campionato Europeo GP', value: 'gp-europeo' },
          { title: 'Motomondiale', value: 'motomondiale' },
          { title: 'Superbike', value: 'superbike' },
          { title: 'Superstock (Direttore Sportivo)', value: 'superstock' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Anno',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1985).max(2030),
    }),
    defineField({
      name: 'season',
      title: 'Stagione (testo libero, facoltativo)',
      type: 'string',
    }),
    defineField({
      name: 'source',
      title: 'Testata (es. Motosprint)',
      type: 'string',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data di pubblicazione originale',
      type: 'date',
    }),
    defineField({
      name: 'summary',
      title: 'Riassunto breve (per Google, 150 caratteri circa)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Foto copertina',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Testo articolo (trascrizione completa)',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }],
    }),
    defineField({
      name: 'scans',
      title: 'Scansioni originali del giornale',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'standings',
      title: 'Classifica gara',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'standingRow',
          fields: [
            { name: 'position', title: 'Posizione', type: 'number' },
            { name: 'rider', title: 'Pilota', type: 'string' },
            { name: 'points', title: 'Punti', type: 'number' },
            { name: 'race', title: 'Gara', type: 'string' },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'year' },
  },
})
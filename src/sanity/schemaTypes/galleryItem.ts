import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'galleryItem',
  title: 'Gallery Item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Testo alternativo (SEO)',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'year',
      title: 'Anno',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descrizione',
      type: 'text',
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          { title: 'Sport Production', value: 'sport-production' },
          { title: 'Trofeo Gilera', value: 'trofeo-gilera' },
          { title: 'Campionato Italiano GP', value: 'gp-italiano' },
          { title: 'Campionato Europeo GP', value: 'gp-europeo' },
          { title: 'Motomondiale', value: 'motomondiale' },
          { title: 'Superbike', value: 'superbike' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', media: 'image' },
  },
})
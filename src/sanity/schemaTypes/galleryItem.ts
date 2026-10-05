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
          { title: 'Campionato Italiano 125cc', value: 'gp-italiano-125' },
          { title: 'Campionato Italiano 250cc', value: 'gp-italiano-250' },
          { title: 'Campionato Europeo 125cc', value: 'gp-europeo-125' },
          { title: 'Campionato Europeo 250cc', value: 'gp-europeo-250' },
          { title: 'Motomondiale', value: 'motomondiale' },
          { title: 'Superbike', value: 'superbike' },
          { title: 'Superstock', value: 'superstock' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', media: 'image' },
  },
})
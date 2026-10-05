import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'commentoNotizia',
  title: 'Commento notizia',
  type: 'document',
  fields: [
    defineField({
      name: 'titolo',
      title: 'Titolo della notizia',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link della notizia (copialo dalla pagina Notizie)',
      type: 'url',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'fonte',
      title: 'Fonte (es. GPOne, Moto.it)',
      type: 'string',
    }),
    defineField({
      name: 'commento',
      title: 'Il mio commento',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required().min(20),
    }),
    defineField({
      name: 'data',
      title: 'Data',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    { title: 'Più recenti', name: 'dataDesc', by: [{ field: 'data', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'titolo', subtitle: 'fonte' },
  },
})
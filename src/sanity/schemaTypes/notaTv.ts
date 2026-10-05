import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'notaTv',
  title: 'Nota TV (orari GP)',
  type: 'document',
  fields: [
    defineField({
      name: 'anno',
      title: 'Anno',
      type: 'number',
      initialValue: () => new Date().getFullYear(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gp',
      title: 'Sigla GP (es. INA, AUS, ITA: è quella nell\'indirizzo della pagina del GP)',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase(),
    }),
    defineField({
      name: 'testo',
      title: 'Nota TV8 / in chiaro',
      description: 'Es: TV8 trasmette qualifiche e Sprint in diretta. Gare in differita: Moto3 11:00, Moto2 12:15, MotoGP 14:00.',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { gp: 'gp', anno: 'anno', testo: 'testo' },
    prepare: ({ gp, anno, testo }) => ({ title: `${gp} ${anno}`, subtitle: testo }),
  },
})

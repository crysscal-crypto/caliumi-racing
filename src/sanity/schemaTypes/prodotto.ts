import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'prodotto',
  title: 'Prodotto consigliato (Amazon)',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome del prodotto',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          { title: 'Caschi', value: 'caschi' },
          { title: 'Guanti', value: 'guanti' },
          { title: 'Tute e giacche', value: 'tute' },
          { title: 'Stivali', value: 'stivali' },
          { title: 'Accessori', value: 'accessori' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'asin',
      title: 'Codice ASIN di Amazon',
      description:
        "Sono 10 caratteri (lettere maiuscole e numeri). Lo trovi nell'indirizzo della pagina del prodotto su Amazon.it, subito dopo /dp/",
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[A-Z0-9]{10}$/, { name: 'ASIN' })
          .error("L'ASIN deve avere 10 caratteri, solo lettere maiuscole e numeri"),
    }),
    defineField({
      name: 'descrizione',
      title: 'Perché lo consigli (due righe, in prima persona, facoltativa)',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'immagine',
      title: 'Una tua foto del prodotto (facoltativa)',
      description:
        'Usa una foto tua. Non scaricare le immagini dal sito di Amazon per ricaricarle qui. Se la carichi, vale più del codice SiteStripe.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Testo alternativo (SEO)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'immagineAmazon',
      title: 'Immagine da SiteStripe (facoltativa)',
      description:
        'Su Amazon.it, con la barra SiteStripe in alto: Ottieni link, scheda Immagine, copia il codice e incollalo qui.',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'inEvidenza',
      title: 'Mostra nella home e negli articoli',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'ordine',
      title: 'Ordine (numero più basso = prima)',
      type: 'number',
    }),
  ],
  preview: {
    select: { title: 'nome', subtitle: 'categoria', media: 'immagine' },
  },
})
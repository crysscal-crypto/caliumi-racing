import { defineField, defineType } from 'sanity'

// Cristian chiede all'IA di scrivere subito un articolo: la bozza arriva in "Notizia scritta da me" entro pochi minuti
export default defineType({
  name: 'richiestaArticolo',
  title: "✍️ Chiedi un articolo all'IA",
  type: 'document',
  fields: [
    defineField({
      name: 'argomento',
      title: 'Argomento: cosa vuoi che scriva (facoltativo)',
      description:
        "Es. \"Marquez campione del mondo in Qatar\". Lascia vuoto e l'IA sceglie la notizia più interessante del momento.",
      type: 'string',
    }),
    defineField({
      name: 'note',
      title: 'Informazioni da usare (facoltativo)',
      description: "Fatti, numeri o dichiarazioni che vuoi nell'articolo. L'IA usa solo fatti veri: quelli delle notizie e questi.",
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'riprova',
      title: 'Riprova',
      description: "Se l'esito è ❌, spunta e clicca Publish: l'IA ci riprova.",
      type: 'boolean',
    }),
    defineField({
      name: 'esito',
      title: 'Esito',
      description: 'Si compila da solo dopo il Publish (entro circa 5 minuti).',
      type: 'string',
      readOnly: true,
    }),
    defineField({ name: 'tentativi', title: 'Tentativi', type: 'number', readOnly: true, hidden: true }),
  ],
  preview: {
    select: { argomento: 'argomento', esito: 'esito' },
    prepare: ({ argomento, esito }) => ({
      title: argomento || "Argomento scelto dall'IA",
      subtitle: esito || '⏳ In attesa (clicca Publish)',
    }),
  },
})

import { defineField, defineType } from 'sanity'

// Commenti lasciati dai lettori sotto le notizie: compaiono sul sito SOLO dopo l'approvazione
export default defineType({
  name: 'commentoLettore',
  title: 'Commento dei lettori',
  type: 'document',
  fields: [
    defineField({
      name: 'approvato',
      title: 'Approvato (spunta e clicca Publish per farlo comparire sul sito)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({ name: 'nome', title: 'Nome', type: 'string', readOnly: true }),
    defineField({ name: 'testo', title: 'Commento', type: 'text', rows: 5 }),
    defineField({ name: 'pagina', title: 'Pagina', type: 'string', readOnly: true }),
    defineField({ name: 'titoloPagina', title: 'Articolo', type: 'string', readOnly: true }),
    defineField({ name: 'data', title: 'Data', type: 'datetime', readOnly: true }),
    defineField({ name: 'impronta', title: 'Impronta (anti-spam)', type: 'string', readOnly: true, hidden: true }),
  ],
  orderings: [{ title: 'Più recenti', name: 'recenti', by: [{ field: 'data', direction: 'desc' }] }],
  preview: {
    select: { title: 'testo', nome: 'nome', articolo: 'titoloPagina', approvato: 'approvato' },
    prepare: ({ title, nome, articolo, approvato }) => ({
      title: `${approvato ? '✅' : '⏳'} ${nome ?? ''}: ${title ?? ''}`,
      subtitle: articolo,
    }),
  },
})

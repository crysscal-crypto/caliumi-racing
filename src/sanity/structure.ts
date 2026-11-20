import type { StructureResolver } from 'sanity/structure'

// Menu dello Studio, diviso per argomento
const GIA_NEL_MENU = [
  'notiziaRedazione',
  'richiestaArticolo',
  'commentoLettore',
  'commentoNotizia',
  'articolo',
  'campionato',
  'moto',
  'galleryItem',
  'pagina',
  'prodotto',
  'notaTv',
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Caliumi Racing')
    .items([
      // ===== REDAZIONE =====
      S.listItem()
        .id('redazione')
        .title('📰 Redazione')
        
        .child(
          S.list()
            .title('Redazione')
            .items([
              S.documentTypeListItem('notiziaRedazione').title('📝 Tutti gli articoli'),
              S.listItem()
                .id('bozze')
                .title('⏳ Da controllare (bozze)')
                
                .child(
                  S.documentList()
                    .title('Bozze da controllare')
                    .filter('_type == "notiziaRedazione" && _id in path("drafts.**")')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }]),
                ),
              S.listItem()
                .id('pubblicati')
                .title('✅ Pubblicati')
                
                .child(
                  S.documentList()
                    .title('Articoli pubblicati')
                    .filter('_type == "notiziaRedazione" && !(_id in path("drafts.**"))')
                    .defaultOrdering([{ field: 'dataPubblicazione', direction: 'desc' }]),
                ),
              S.divider(),
              S.documentTypeListItem('richiestaArticolo').title("🤖 Chiedi un articolo all'IA"),
              S.documentTypeListItem('commentoNotizia').title('🗨️ Commenti alle notizie del web'),
            ]),
        ),

      S.listItem()
        .id('commentiDaApprovare')
        .title('💬 Commenti da approvare')
        
        .child(
          S.documentList()
            .title('Commenti da approvare')
            .filter('_type == "commentoLettore" && approvato != true')
            .defaultOrdering([{ field: 'data', direction: 'desc' }]),
        ),
      S.documentTypeListItem('commentoLettore').title('👥 Tutti i commenti dei lettori'),

      S.divider(),

      // ===== LA MIA CARRIERA =====
      S.listItem()
        .id('carriera')
        .title('🏁 La mia carriera')
        
        .child(
          S.list()
            .title('La mia carriera')
            .items([
              S.documentTypeListItem('articolo').title('🗞️ Articoli e ritagli di giornale'),
              S.documentTypeListItem('campionato').title('🏆 Campionati e classifiche'),
              S.documentTypeListItem('moto').title('🏍️ Le mie moto'),
              S.documentTypeListItem('galleryItem').title('📷 Gallery'),
              S.documentTypeListItem('pagina').title('📄 Pagine'),
            ]),
        ),

      // ===== GUADAGNI E SITO =====
      S.listItem()
        .id('sito')
        .title('💰 Guadagni e sito')
        
        .child(
          S.list()
            .title('Guadagni e sito')
            .items([
              S.documentTypeListItem('prodotto').title('🛒 Prodotti consigliati (Amazon)'),
              S.documentTypeListItem('notaTv').title('📺 Note TV (orari GP)'),
            ]),
        ),

      // eventuali tipi nuovi non ancora nel menu
      ...S.documentTypeListItems().filter((i) => !GIA_NEL_MENU.includes(i.getId() ?? '')),
    ])

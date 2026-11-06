import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .id('commentiDaApprovare')
        .title('⏳ Commenti da approvare')
        .child(
          S.documentList()
            .title('Commenti da approvare')
            .filter('_type == "commentoLettore" && approvato != true')
            .defaultOrdering([{field: 'data', direction: 'desc'}]),
        ),
      S.divider(),
      ...S.documentTypeListItems(),
    ])

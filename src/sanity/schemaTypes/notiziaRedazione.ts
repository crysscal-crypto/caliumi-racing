import { defineArrayMember, defineField, defineType } from "sanity";

// Notizie scritte da Cristian: compaiono in cima alla pagina Notizie e hanno una pagina tutta loro
export default defineType({
  name: "notiziaRedazione",
  title: "Notizia scritta da me",
  type: "document",
  fields: [
    defineField({
      name: "titolo",
      title: "Titolo",
      type: "string",
      validation: (Rule) => Rule.required().max(110),
    }),
    defineField({
      name: "slug",
      title: "Indirizzo della pagina (clicca Genera)",
      type: "slug",
      options: { source: "titolo", maxLength: 90 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "campionato",
      title: "Campionato",
      type: "string",
      options: {
        list: [
          { title: "MotoGP", value: "MotoGP" },
          { title: "Moto2 / Moto3", value: "Moto2 / Moto3" },
          { title: "Superbike", value: "Superbike" },
          { title: "CIV", value: "CIV" },
          { title: "Motocross / Enduro", value: "Motocross" },
          { title: "Tecnica (come sono fatte le moto)", value: "Tecnica" },
          { title: "Altro", value: "Moto" },
        ],
        layout: "radio",
      },
      initialValue: "MotoGP",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dataPubblicazione",
      title: "Data di pubblicazione",
      description:
        "Per programmare l'uscita metti una data/ora futura e clicca Publish: l'articolo resta nascosto fino a quell'ora, poi compare sul sito e partono da soli storia Instagram e post Facebook.",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "autoPubblica",
      title: "Pubblica da solo dopo 2 ore",
      description: "Impostato dall'IA: se non pubblichi o cancelli la bozza, esce da sola 2 ore dopo essere stata scritta. Togli la spunta per tenerla ferma.",
      type: "boolean",
    }),
    defineField({
      name: "autore",
      title: "Autore (facoltativo: lascia vuoto e compare solo il logo)",
      type: "string",
    }),
    defineField({
      name: "copertina",
      title: "Foto di copertina",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Descrizione della foto (per Google)", type: "string" }),
        defineField({ name: "credito", title: "Credito foto (es. © MotoGP.com)", type: "string" }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sommario",
      title: "Sommario (2 righe: compare nell'anteprima e su Google)",
      description: "Puoi lasciarlo vuoto: dopo il Publish lo scrive l'IA da sola entro 5 minuti.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: "testo",
      title: "Testo dell'articolo",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normale", value: "normal" },
            { title: "Titoletto", value: "h2" },
            { title: "Titoletto piccolo", value: "h3" },
            { title: "Citazione", value: "blockquote" },
          ],
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Descrizione della foto (per Google)", type: "string" }),
            defineField({ name: "didascalia", title: "Didascalia", type: "string" }),
          ],
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    { title: "Più recenti", name: "recenti", by: [{ field: "dataPubblicazione", direction: "desc" }] },
  ],
  preview: {
    select: { title: "titolo", subtitle: "campionato", media: "copertina" },
  },
});

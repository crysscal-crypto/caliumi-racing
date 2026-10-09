import type { Metadata } from "next";
import { racingFont } from "@/sanity/lib/fonts";

// ===== DATI DEL TITOLARE =====
const TITOLARE = "Cristian Caliumi";
const EMAIL = ""; // es. "info@caliumiracing.com" – indirizzo per le richieste privacy
const AGGIORNATA = "8 ottobre 2026";
// =============================

export const metadata: Metadata = {
  title: "Privacy e Cookie Policy | Caliumi Racing",
  description: "Informativa sul trattamento dei dati personali e sull'uso dei cookie del sito caliumiracing.com.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-2 text-xl font-semibold text-racing-yellow">{titolo}</h2>
      <div className="space-y-3 text-white/80">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  const contatto = EMAIL ? (
    <a href={`mailto:${EMAIL}`} className="text-racing-yellow underline">{EMAIL}</a>
  ) : (
    <span>i contatti indicati nelle pagine social collegate al sito</span>
  );

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className={`${racingFont.className} mb-2 text-center text-3xl text-racing-yellow sm:text-4xl`}>
          Privacy e Cookie Policy
        </h1>
        <p className="mb-10 text-center text-sm text-white/50">Ultimo aggiornamento: {AGGIORNATA}</p>

        <Sezione titolo="1. Titolare del trattamento">
          <p>
            Il titolare del trattamento dei dati raccolti tramite il sito www.caliumiracing.com è {TITOLARE}. Per
            qualsiasi richiesta sulla privacy puoi scrivere a {contatto}.
          </p>
        </Sezione>

        <Sezione titolo="2. Quali dati raccogliamo">
          <p>
            Il sito non ha moduli di registrazione, commenti o aree riservate ai visitatori e non chiede di inserire
            dati personali.
          </p>
          <p>
            <strong>Dati di navigazione.</strong> I server che ospitano il sito (Vercel Inc.) registrano
            automaticamente alcuni dati tecnici necessari al funzionamento e alla sicurezza, come indirizzo IP, tipo
            di browser, pagine visitate e orario della richiesta. Questi dati sono usati solo in forma tecnica e non
            per identificare i visitatori.
          </p>
          <p>
            <strong>Pubblicità.</strong> Il sito può mostrare annunci tramite Google AdSense. Google e i suoi partner
            possono usare cookie e identificatori per mostrare annunci, anche personalizzati, e misurarne
            l&apos;efficacia, solo dopo il tuo consenso quando richiesto dalla legge.
          </p>
        </Sezione>

        <Sezione titolo="3. Finalità e base giuridica">
          <p>
            I dati di navigazione sono trattati per il legittimo interesse a far funzionare il sito e a proteggerlo
            da abusi (art. 6.1.f GDPR). I cookie pubblicitari e di profilazione sono usati solo con il tuo consenso
            (art. 6.1.a GDPR), che puoi negare o revocare in ogni momento.
          </p>
        </Sezione>

        <Sezione titolo="4. Cookie">
          <p>
            <strong>Cookie tecnici:</strong> necessari al funzionamento del sito, non richiedono consenso.
          </p>
          <p>
            <strong>Cookie di terze parti (Google AdSense):</strong> usati per la pubblicità. Al primo accesso un
            banner ti permette di accettarli, rifiutarli o scegliere quali consentire. Puoi cambiare idea in
            qualsiasi momento dal link &quot;Gestisci le preferenze&quot; del banner o cancellando i cookie dal
            browser.
          </p>
          <p>
            Per sapere come Google usa i dati:{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="text-racing-yellow underline"
            >
              policies.google.com/technologies/partner-sites
            </a>
            . Puoi gestire gli annunci personalizzati da{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-racing-yellow underline">
              adssettings.google.com
            </a>
            .
          </p>
        </Sezione>

        <Sezione titolo="5. Link affiliati">
          <p>
            Alcune pagine contengono link affiliati, ad esempio verso Amazon. Se acquisti un prodotto dopo aver
            cliccato, il sito può ricevere una piccola commissione, senza costi aggiuntivi per te. In qualità di
            Affiliato Amazon, io ricevo un guadagno dagli acquisti idonei. I link affiliati sono segnalati accanto ai
            prodotti.
          </p>
        </Sezione>

        <Sezione titolo="6. Link esterni e contenuti di terzi">
          <p>
            Il sito contiene link a siti esterni (testate giornalistiche, social network, dati MotoGP). Quando li
            apri si applicano le informative privacy di quei siti. I risultati e le classifiche MotoGP sono letti da
            fonti pubbliche senza trasmettere tuoi dati personali.
          </p>
        </Sezione>

        <Sezione titolo="7. Dove sono conservati i dati">
          <p>
            Il sito è ospitato da Vercel Inc. e i contenuti sono gestiti con Sanity; alcuni server possono trovarsi
            fuori dall&apos;Unione Europea. In questi casi il trasferimento avviene con le garanzie previste dal GDPR
            (clausole contrattuali standard o decisioni di adeguatezza). I dati di navigazione sono conservati per il
            tempo strettamente necessario.
          </p>
        </Sezione>

        <Sezione titolo="8. I tuoi diritti">
          <p>
            Puoi chiedere in ogni momento accesso, rettifica, cancellazione, limitazione od opposizione al trattamento
            dei tuoi dati e la revoca del consenso, scrivendo a {contatto}. Puoi anche presentare reclamo al Garante
            per la protezione dei dati personali (
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-racing-yellow underline">
              www.garanteprivacy.it
            </a>
            ).
          </p>
        </Sezione>

        <Sezione titolo="9. Modifiche">
          <p>
            Questa informativa può essere aggiornata, ad esempio se cambiano i servizi usati dal sito. La data
            dell&apos;ultimo aggiornamento è indicata in alto.
          </p>
        </Sezione>
      </div>
    </section>
  );
}
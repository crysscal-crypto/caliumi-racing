// Ponte MotoGP per caliumiracing.com (Google Apps Script, gratuito).
// Inoltra al servizio dati MotoGP le richieste del sito, che da Cloudflare verrebbero bloccate.
// Accetta solo percorsi dell'API MotoGP: non può essere usato per altri siti.
function doGet(e) {
  var p = (e && e.parameter && e.parameter.p) || '';
  if (!/^\/[A-Za-z0-9\/_\-?=&.%]*$/.test(p)) {
    return risposta({ __errore: 400 });
  }
  var r = UrlFetchApp.fetch('https://api.motogp.pulselive.com/motogp/v1' + p, {
    muteHttpExceptions: true,
    headers: { Accept: 'application/json' }
  });
  if (r.getResponseCode() !== 200) {
    return risposta({ __errore: r.getResponseCode() });
  }
  return ContentService.createTextOutput(r.getContentText()).setMimeType(ContentService.MimeType.JSON);
}

function risposta(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * GAS web app entry point.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Lantern Crawl')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns the content of an HTML partial. Used from templates: <?!= include('style') ?>
 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

var RANKING_SHEET_PROPERTY = 'RANKING_SHEET_ID';
var RANKING_HEADER = ['name', 'score', 'result', 'level', 'seconds', 'at'];

// Returns the ranking sheet, or null when it does not exist yet (unless `create`).
function rankingSheet_(create) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(RANKING_SHEET_PROPERTY);
  if (id) return SpreadsheetApp.openById(id).getSheets()[0];
  if (!create) return null;
  var spreadsheet = SpreadsheetApp.create('Lantern Crawl Ranking');
  var sheet = spreadsheet.getSheets()[0];
  sheet.appendRow(RANKING_HEADER);
  props.setProperty(RANKING_SHEET_PROPERTY, spreadsheet.getId());
  return sheet;
}

function readEntries_(sheet) {
  var values = sheet.getDataRange().getValues().slice(1);
  return values.map(function (row) {
    return {
      name: String(row[0]),
      score: Number(row[1]),
      result: String(row[2]),
      level: Number(row[3]),
      seconds: Number(row[4]),
      at: row[5] instanceof Date ? row[5].toISOString() : String(row[5])
    };
  });
}

// A leading ' makes Sheets store the value as text instead of a formula.
function asText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

/** Saves a finished run. Returns { rank, top }. */
function submitScore(input) {
  var entry = normalizeEntry(input, Date.now());
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = rankingSheet_(true);
    sheet.appendRow([asText_(entry.name), entry.score, entry.result, entry.level, entry.seconds, entry.at]);
    var entries = readEntries_(sheet);
    // The appended row is the last one.
    return rankEntries(entries, entries[entries.length - 1]);
  } finally {
    lock.releaseLock();
  }
}

/** Returns the top entries. */
function getRanking() {
  var sheet = rankingSheet_(false);
  return sheet ? rankEntries(readEntries_(sheet), null).top : [];
}

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

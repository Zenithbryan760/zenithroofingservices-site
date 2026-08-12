(function () {
  'use strict';

  var input = document.getElementById('service-area-search-input');
  var clearButton = document.getElementById('service-area-search-clear');
  var status = document.getElementById('service-area-search-status');
  var list = document.querySelector('[data-service-area-list]');
  var featured = document.querySelector('[data-service-area-featured]');
  var empty = document.querySelector('[data-service-area-empty]');

  if (!input || !clearButton || !status || !list || !empty) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.service-area-card'));

  function normalize(value) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function update() {
    var rawQuery = input.value.trim();
    var query = normalize(rawQuery);
    var visible = 0;

    cards.forEach(function (card) {
      var areaName = normalize((card.textContent || '') + ' ' + (card.getAttribute('data-search') || ''));
      var matches = !query || areaName.indexOf(query) !== -1;
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    clearButton.hidden = !query;
    empty.hidden = visible !== 0;
    if (featured) featured.hidden = Boolean(query);

    if (!query) {
      status.textContent = cards.length + ' service areas available.';
    } else if (visible === 1) {
      status.textContent = '1 service area found for “' + rawQuery + '”. Select it below.';
    } else {
      status.textContent = visible + ' service areas found for “' + rawQuery + '”.';
    }
  }

  input.addEventListener('input', update);
  input.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    var visibleCards = cards.filter(function (card) { return !card.hidden; });
    if (visibleCards.length !== 1) return;
    var link = visibleCards[0].querySelector('a');
    if (link) {
      event.preventDefault();
      window.location.href = link.href;
    }
  });

  clearButton.addEventListener('click', function () {
    input.value = '';
    update();
    input.focus();
  });

  var initialArea = new URLSearchParams(window.location.search).get('area');
  if (initialArea) input.value = initialArea;

  update();
}());

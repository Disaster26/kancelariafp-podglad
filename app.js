/* =====================================================================
   STAWKI PRZYKLADOWE - kancelaria ustala wlasne.
   Po wdrozeniu wlascicielka zmienia je w panelu (bez programisty).
   Kazda para to widelki [od, do] w zl netto miesiecznie.
   ===================================================================== */
const STAWKI = {
  jdg: {
    ryczalt: { baza: [180, 250], wliczone: 20, zaDokument: [2, 3] },
    kpir:    { baza: [250, 350], wliczone: 20, zaDokument: [3, 4] },
    pelna:   { baza: [600, 850], wliczone: 30, zaDokument: [5, 7] },
    vat:     [80, 120]
  },
  spolka: {
    kpir:    { baza: [400, 550], wliczone: 30, zaDokument: [3, 4] },
    pelna:   { baza: [800, 1100], wliczone: 40, zaDokument: [5, 7] },
    vat:     [100, 150]
  },
  pracownik: [50, 70],          // kadry i place przy obsludze ksiegowej, za osobe
  kadry: { zaOsobe: [60, 80], minimum: [150, 200] } // same kadry i place
};
const MAIL = { wyszkow: 'wyszkow@kancelaria-fp.pl', radzymin: 'radzymin@kancelaria-fp.pl' };
const NAZWY = {
  usluga: { jdg: 'Działalność gospodarcza', spolka: 'Spółka', kadry: 'Kadry i płace' },
  forma: { ryczalt: 'Ryczałt', kpir: 'KPiR', pelna: 'Pełna księgowość' }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const zl = n => n.toLocaleString('pl-PL').replace(/ /g, ' ');
const zaokr = n => Math.round(n / 10) * 10;

/* ---------------- menu ---------------- */
(() => {
  const burger = $('.burger'), menu = $('#menu'), grupa = $('.menu-grupa'), rozw = $('.menu-rozwin');
  const zamknij = () => { menu.classList.remove('otwarte'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  burger.addEventListener('click', () => {
    const o = !menu.classList.contains('otwarte');
    menu.classList.toggle('otwarte', o);
    burger.setAttribute('aria-expanded', String(o));
    document.body.style.overflow = o ? 'hidden' : '';
  });
  rozw.addEventListener('click', () => {
    const o = !grupa.classList.contains('otwarte');
    grupa.classList.toggle('otwarte', o);
    rozw.setAttribute('aria-expanded', String(o));
  });
  $$('#menu a').forEach(a => a.addEventListener('click', zamknij));
  document.addEventListener('click', e => { if (!grupa.contains(e.target)) { grupa.classList.remove('otwarte'); rozw.setAttribute('aria-expanded', 'false'); } });
  addEventListener('resize', () => { if (innerWidth > 1100) zamknij(); });
})();

/* ---------------- kalkulator ---------------- */
const form = $('#kalkForm');
const dok = $('#dok'), dokWart = $('#dokWart');
const prac = $('#prac'), pracOpis = $('#pracOpis');
const uwaga = $('#formaUwaga');
let ostatni = null;

const wartosc = n => (form.querySelector(`input[name="${n}"]:checked`) || {}).value;

function osoby(n) {
  if (n === 0) return 'bez pracowników';
  if (n === 1) return '1 osoba';
  const d = n % 10, s = n % 100;
  return n + (d >= 2 && d <= 4 && (s < 12 || s > 14) ? ' osoby' : ' osób');
}

function ustawSuwak() {
  const p = (dok.value - dok.min) / (dok.max - dok.min) * 100;
  dok.style.setProperty('--p', p + '%');
  dokWart.textContent = dok.value >= 200 ? '200+' : dok.value;
}

function przelicz() {
  const usluga = wartosc('usluga');
  const kadry = usluga === 'kadry';

  // pola zalezne od uslugi
  $$('[data-ukryj="kadry"]').forEach(el => { el.hidden = kadry; });
  const ryczalt = form.querySelector('input[name="forma"][value="ryczalt"]');
  ryczalt.disabled = usluga === 'spolka';
  if (ryczalt.disabled && ryczalt.checked) form.querySelector('input[name="forma"][value="kpir"]').checked = true;
  uwaga.hidden = usluga !== 'spolka';

  let n = Math.max(0, Math.min(99, parseInt(prac.value, 10) || 0));
  if (kadry && n < 1) n = 1;
  if (String(n) !== prac.value) prac.value = n;
  prac.min = kadry ? 1 : 0;
  pracOpis.textContent = osoby(n);
  ustawSuwak();

  const sklad = [];
  let od = 0, doo = 0;
  if (kadry) {
    const k = STAWKI.kadry;
    od = Math.max(k.minimum[0], n * k.zaOsobe[0]);
    doo = Math.max(k.minimum[1], n * k.zaOsobe[1]);
    sklad.push([`Kadry i płace, ${osoby(n)}`, od, doo]);
  } else {
    const forma = wartosc('forma');
    const s = STAWKI[usluga][forma];
    const d = +dok.value;
    sklad.push([`${NAZWY.forma[forma]}, do ${s.wliczone} dokumentów`, s.baza[0], s.baza[1]]);
    const ponad = Math.max(0, d - s.wliczone);
    if (ponad) sklad.push([`Dokumenty ponad limit (${ponad})`, ponad * s.zaDokument[0], ponad * s.zaDokument[1]]);
    if (wartosc('vat') === 'tak') sklad.push(['Rozliczenie VAT i JPK', STAWKI[usluga].vat[0], STAWKI[usluga].vat[1]]);
    if (n) sklad.push([`Kadry i płace, ${osoby(n)}`, n * STAWKI.pracownik[0], n * STAWKI.pracownik[1]]);
    sklad.forEach(([, a, b]) => { od += a; doo += b; });
  }
  od = zaokr(od); doo = zaokr(doo);
  $('#wOd').textContent = zl(od);
  $('#wDo').textContent = zl(doo);
  $('#mOd').textContent = zl(od);
  $('#mDo').textContent = zl(doo);
  $('#wSklad').innerHTML = sklad.map(([t, a, b]) => `<li><span>${t}</span><b>${zl(zaokr(a))}-${zl(zaokr(b))} zł</b></li>`).join('');

  ostatni = {
    usluga: NAZWY.usluga[usluga],
    forma: kadry ? null : NAZWY.forma[wartosc('forma')],
    dokumenty: kadry ? null : (+dok.value >= 200 ? '200+' : dok.value),
    pracownicy: n,
    vat: kadry ? null : (wartosc('vat') === 'tak' ? 'tak' : 'nie'),
    od, doo
  };
}

form.addEventListener('input', przelicz);
form.addEventListener('change', przelicz);
$('#pracMinus').addEventListener('click', () => { prac.value = Math.max(+prac.min || 0, (parseInt(prac.value, 10) || 0) - 1); przelicz(); });
$('#pracPlus').addEventListener('click', () => { prac.value = Math.min(99, (parseInt(prac.value, 10) || 0) + 1); przelicz(); });
prac.addEventListener('focus', () => prac.select());
przelicz();

/* ---------------- zapytanie (w podgladzie bez wysylki) ---------------- */
const zap = $('#zapytanie'), ok = $('#zapOk'), blad = $('#zapBlad');
zap.addEventListener('submit', e => {
  e.preventDefault();
  const imie = zap.imie, kontakt = zap.kontakt, zgoda = zap.zgoda;
  const v = kontakt.value.trim();
  const okKontakt = /\S+@\S+\.\S+/.test(v) || v.replace(/\D/g, '').length >= 9;
  imie.classList.toggle('zle', !imie.value.trim());
  kontakt.classList.toggle('zle', !okKontakt);
  zgoda.closest('.zgoda').classList.toggle('zle', !zgoda.checked);
  if (!imie.value.trim() || !okKontakt || !zgoda.checked) {
    blad.textContent = !imie.value.trim() ? 'Wpisz imię.' : !okKontakt ? 'Podaj numer telefonu albo adres e-mail.' : 'Zaznacz zgodę na przetwarzanie danych.';
    blad.hidden = false;
    return;
  }
  blad.hidden = true;
  const adres = MAIL[zap.biuro.value];
  const w = ostatni;
  const linie = [
    `Imię: ${imie.value.trim()}`,
    `Kontakt: ${v}`,
    '',
    `Usługa: ${w.usluga}`,
    w.forma ? `Forma: ${w.forma}` : null,
    w.dokumenty !== null ? `Dokumenty w miesiącu: ${w.dokumenty}` : null,
    `Pracownicy: ${w.pracownicy}`,
    w.vat ? `Czynny VAT: ${w.vat}` : null,
    `Wycena orientacyjna: ${zl(w.od)}-${zl(w.doo)} zł netto / mies.`
  ].filter(x => x !== null);
  $('#okMail').textContent = adres;
  $('#okMailto').href = `mailto:${adres}?subject=${encodeURIComponent('Zapytanie z kalkulatora - ' + w.usluga)}&body=${encodeURIComponent(linie.join('\n'))}`;
  zap.hidden = true;
  ok.hidden = false;
  ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
$$('input', zap).forEach(i => i.addEventListener('input', () => { i.classList.remove('zle'); i.closest('.zgoda')?.classList.remove('zle'); }));
$('#zapWroc').addEventListener('click', () => { ok.hidden = true; zap.hidden = false; });

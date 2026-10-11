import { listEventTypes, listSlots } from './sdk.gen.js';

const typeStep = document.getElementById('type-step');
const timeStep = document.getElementById('time-step');
const stepTypeMarker = document.getElementById('step-type');
const stepTimeMarker = document.getElementById('step-time');
const typeGrid = document.getElementById('type-grid');
const typesEmpty = document.getElementById('types-empty');
const typeError = document.getElementById('type-error');
const selectedType = document.getElementById('selected-type');
const backToTypes = document.getElementById('back-to-types');
const calendar = document.getElementById('calendar');
const windowRange = document.getElementById('window-range');
const prevDays = document.getElementById('prev-days');
const nextDays = document.getElementById('next-days');
const daysStrip = document.getElementById('days');
const daySlotsTitle = document.getElementById('day-slots-title');
const daySlots = document.getElementById('day-slots');
const slotsEmpty = document.getElementById('slots-empty');
const slotsError = document.getElementById('slots-error');
const timezoneNote = document.getElementById('timezone-note');

const DAYS_PER_PAGE = 7;
const LOAD_TYPES_ERROR = 'Не удалось загрузить типы событий';
const LOAD_SLOTS_ERROR = 'Не удалось загрузить слоты';

// Часовой пояс и границы окна приходят только из ответа сервера.
let timezone = null;
let days = [];
let page = 0;
let selectedDayKey = null;

function showError(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  element.textContent = '';
  element.hidden = true;
}

function problemDetail(error) {
  if (error && typeof error === 'object' && typeof error.detail === 'string') {
    return error.detail;
  }

  return '';
}

function dayKey(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function dayLabel(iso) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

function dayTitle(iso) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

function timeLabel(iso) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function slotPlural(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} слот`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} слота`;
  }

  return `${count} слотов`;
}

function showStep(name) {
  const onTime = name === 'time';

  typeStep.hidden = onTime;
  timeStep.hidden = !onTime;
  stepTypeMarker.classList.toggle('is-active', !onTime);
  stepTypeMarker.classList.toggle('is-done', onTime);
  stepTimeMarker.classList.toggle('is-active', onTime);

  if (onTime) {
    stepTypeMarker.removeAttribute('aria-current');
    stepTimeMarker.setAttribute('aria-current', 'step');
  }
}

function groupByDay(slots) {
  const byKey = new Map();

  for (const slot of slots) {
    const key = dayKey(slot.start);
    let day = byKey.get(key);

    if (!day) {
      day = { key, iso: slot.start, slots: [], free: 0 };
      byKey.set(key, day);
    }

    day.slots.push(slot);

    if (slot.available) {
      day.free += 1;
    }
  }

  return [...byKey.values()];
}

function renderTypes(eventTypes) {
  typeGrid.replaceChildren();
  typesEmpty.hidden = eventTypes.length > 0;

  for (const eventType of eventTypes) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'type-card-button';

    const head = document.createElement('div');
    head.className = 'type-head';

    const name = document.createElement('h2');
    name.textContent = eventType.name;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${eventType.durationMinutes} мин`;

    head.append(name, badge);
    card.append(head);

    if (eventType.description) {
      const description = document.createElement('p');
      description.textContent = eventType.description;
      card.append(description);
    }

    card.addEventListener('click', () => openTimeStep(eventType));
    typeGrid.append(card);
  }
}

function renderDays() {
  daysStrip.replaceChildren();

  const start = page * DAYS_PER_PAGE;

  for (const day of days.slice(start, start + DAYS_PER_PAGE)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day-button';
    button.append(document.createTextNode(dayLabel(day.iso)));

    const note = document.createElement('span');
    note.className = 'day-note';
    note.textContent = day.free > 0 ? slotPlural(day.free) : 'нет мест';
    button.append(note);

    // День без свободных слотов неактивен.
    button.disabled = day.free === 0;

    if (day.key === selectedDayKey) {
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }

    if (day.free > 0) {
      button.addEventListener('click', () => selectDay(day.key));
    }

    daysStrip.append(button);
  }

  prevDays.disabled = page === 0;
  nextDays.disabled = start + DAYS_PER_PAGE >= days.length;
}

function renderDaySlots() {
  daySlots.replaceChildren();

  const day = days.find((item) => item.key === selectedDayKey);

  if (!day) {
    return;
  }

  daySlotsTitle.textContent = dayTitle(day.iso);

  for (const slot of day.slots) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slot-button';
    button.textContent = timeLabel(slot.start);
    button.disabled = !slot.available;

    if (slot.available) {
      button.addEventListener('click', () => selectSlot(button));
    } else {
      button.classList.add('is-busy');
      button.setAttribute('aria-label', `${timeLabel(slot.start)} — занято`);
    }

    daySlots.append(button);
  }
}

function selectSlot(button) {
  for (const other of daySlots.querySelectorAll('.slot-button')) {
    other.classList.remove('is-selected');
    other.setAttribute('aria-pressed', 'false');
  }

  button.classList.add('is-selected');
  button.setAttribute('aria-pressed', 'true');
}

function selectDay(key) {
  selectedDayKey = key;
  renderDays();
  renderDaySlots();
}

async function openTimeStep(eventType) {
  selectedType.textContent = `${eventType.name} · ${eventType.durationMinutes} мин`;
  showStep('time');
  await loadSlots(eventType.id);
}

async function loadSlots(id) {
  hideError(slotsError);
  slotsEmpty.hidden = true;
  calendar.hidden = true;
  daySlots.replaceChildren();
  daySlotsTitle.textContent = '';

  const { data, error } = await listSlots({ path: { id } });

  if (error) {
    showError(slotsError, problemDetail(error) || LOAD_SLOTS_ERROR);
    return;
  }

  const slots = Array.isArray(data?.slots) ? data.slots : [];
  timezone = typeof data?.timezone === 'string' ? data.timezone : timezone;

  if (slots.length === 0) {
    slotsEmpty.hidden = false;
    return;
  }

  days = groupByDay(slots);
  const first = days[0];
  const last = days[days.length - 1];
  windowRange.textContent = `Окно записи: ${dayLabel(first.iso)} — ${dayLabel(last.iso)}`;
  timezoneNote.textContent = `Часовой пояс: ${timezone}. Прошедшее время сегодня скрыто.`;
  calendar.hidden = false;

  const firstFree = days.find((day) => day.free > 0);
  page = firstFree ? Math.floor(days.indexOf(firstFree) / DAYS_PER_PAGE) : 0;
  selectedDayKey = firstFree ? firstFree.key : first.key;

  renderDays();
  renderDaySlots();
}

async function loadTypes() {
  hideError(typeError);

  const { data, error } = await listEventTypes();

  if (error) {
    showError(typeError, problemDetail(error) || LOAD_TYPES_ERROR);
    return;
  }

  renderTypes(Array.isArray(data) ? data : []);
}

backToTypes.addEventListener('click', () => {
  showStep('type');
});

prevDays.addEventListener('click', () => {
  if (page > 0) {
    page -= 1;
    renderDays();
  }
});

nextDays.addEventListener('click', () => {
  if ((page + 1) * DAYS_PER_PAGE < days.length) {
    page += 1;
    renderDays();
  }
});

await loadTypes();

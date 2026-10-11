import { createEventType, listEventTypes } from './sdk.gen.js';

const emptyState = document.getElementById('empty-state');
const tableWrap = document.getElementById('table-wrap');
const tableBody = document.getElementById('event-types-body');
const listError = document.getElementById('list-error');
const dialog = document.getElementById('create-dialog');
const form = document.getElementById('create-form');
const createError = document.getElementById('create-error');
const openButton = document.getElementById('open-create');
const cancelButton = document.getElementById('cancel-create');
const submitButton = document.getElementById('submit-create');
const idInput = document.getElementById('event-type-id');
const nameInput = document.getElementById('event-type-name');
const durationInput = document.getElementById('event-type-duration');
const descriptionInput = document.getElementById('event-type-description');

const DUPLICATE_MESSAGE = 'Тип события с таким ID уже существует';
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить типы событий';
const CREATE_ERROR_MESSAGE = 'Не удалось создать тип события';

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

function createErrorMessage(error) {
  if (error && typeof error === 'object' && error.status === 409) {
    return DUPLICATE_MESSAGE;
  }

  return problemDetail(error) || CREATE_ERROR_MESSAGE;
}

function appendCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
}

function render(eventTypes) {
  tableBody.replaceChildren();

  const hasRows = eventTypes.length > 0;
  emptyState.hidden = hasRows;
  tableWrap.hidden = !hasRows;

  for (const eventType of eventTypes) {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    const slug = document.createElement('code');
    slug.textContent = eventType.id;
    idCell.append(slug);

    row.append(idCell);
    appendCell(row, eventType.name);
    appendCell(row, eventType.description ?? '—');
    appendCell(row, `${eventType.durationMinutes} мин`);

    tableBody.append(row);
  }
}

async function load() {
  hideError(listError);

  const { data, error } = await listEventTypes();

  if (error) {
    showError(listError, problemDetail(error) || LOAD_ERROR_MESSAGE);
    return;
  }

  render(Array.isArray(data) ? data : []);
}

openButton.addEventListener('click', () => {
  hideError(createError);
  dialog.showModal();
});

cancelButton.addEventListener('click', () => {
  dialog.close();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideError(createError);
  submitButton.disabled = true;

  const description = descriptionInput.value.trim();
  const body = {
    id: idInput.value.trim(),
    name: nameInput.value.trim(),
    durationMinutes: Number(durationInput.value),
    description: description === '' ? null : description,
  };

  try {
    const { error } = await createEventType({ body });

    if (error) {
      showError(createError, createErrorMessage(error));
      return;
    }

    dialog.close();
    form.reset();
    await load();
  } finally {
    submitButton.disabled = false;
  }
});

await load();

const ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

function extractUserId(elementId: string) {
  const elem = document.getElementById(elementId) as HTMLInputElement;

  elem.value = elem.value.trim();
  if (!ID_REGEX.test(elem.value)) {
    elem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    alert('Invalid User ID format. A valid UUID is expected.');
    return null;
  }

  return elem.value;
}

function extractPassword(elementId: string, allowEmpty = false) {
  const elem = document.getElementById(elementId) as HTMLInputElement;

  if (allowEmpty && elem.value.length === 0) {
    return '';
  }

  if (elem.value.length < 6) {
    elem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    alert('Password must be at least 6 characters long.');
    return null;
  }

  return elem.value;
}

const validateForm = document.getElementById('validate-form') as HTMLFormElement;
const validateStatusElement = document.getElementById('validate-status') as HTMLParagraphElement;
const validateResultElement = document.getElementById('validate-result') as HTMLParagraphElement;

validateForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const userId = extractUserId('userId');
  if (userId === null) return;
  const password = extractPassword('password', true);
  if (password === null) return;

  const response = await fetch('/auth', {
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + btoa(userId + ':' + password),
    },
  });

  validateStatusElement.textContent = `${response.status} ${response.statusText}`;
  validateStatusElement.className = response.ok ? 'status success' : 'status error';

  let AuthStatus = 'Unknown';
  switch (response.status) {
    case 200:
      AuthStatus = 'Authenticated';
      break;
    case 204:
      AuthStatus = 'Unregistered';
      break;
    case 401:
      AuthStatus = 'Unauthorized';
      break;
    default:
      AuthStatus = response.statusText;
  }

  validateResultElement.textContent = AuthStatus;
});

const changePasswordForm = document.getElementById('change-password-form') as HTMLFormElement;
const changeStatusElement = document.getElementById('change-status') as HTMLParagraphElement;
const changeResultElement = document.getElementById('change-result') as HTMLParagraphElement;

changePasswordForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const userId = extractUserId('changeUserId');
  if (userId === null) return;
  const oldPassword = extractPassword('oldPassword', true);
  if (oldPassword === null) return;
  const newPassword = extractPassword('newPassword');
  if (newPassword === null) return;
  const confirmPassword = extractPassword('confirmPassword');
  if (confirmPassword === null) return;

  if (newPassword !== confirmPassword) {
    alert('New password and confirmation do not match.');
    return;
  }

  const response = await fetch('/auth', {
    method: 'PUT',
    headers: {
      Authorization: 'Basic ' + btoa(userId + ':' + oldPassword),
      'Content-Type': 'text/plain',
    },
    body: newPassword,
  });

  changeStatusElement.textContent = `${response.status} ${response.statusText}`;
  changeStatusElement.className = response.ok ? 'status success' : 'status error';
  changeResultElement.textContent = await response.text();
});

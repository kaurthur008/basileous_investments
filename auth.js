const AUTH_USERS_KEY = 'basileus_investment_users';
const AUTH_CURRENT_KEY = 'basileus_investment_current';

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '{}');
}

function saveStoredUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getCurrentUserEmail() {
  return localStorage.getItem(AUTH_CURRENT_KEY);
}

function setCurrentUserEmail(email) {
  localStorage.setItem(AUTH_CURRENT_KEY, email);
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_CURRENT_KEY);
}

function getCurrentUser() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  const users = getStoredUsers();
  return users[email] || null;
}

function saveCurrentUser(user) {
  const users = getStoredUsers();
  users[user.email] = user;
  saveStoredUsers(users);
}

function showMessage(element, text, type = 'info') {
  if (!element) return;
  element.textContent = text;
  element.style.display = 'block';
  element.style.borderColor = type === 'error' ? 'rgba(255, 125, 125, 0.4)' : 'rgba(75, 200, 255, 0.4)';
  element.style.background = type === 'error' ? 'rgba(255, 80, 80, 0.08)' : 'rgba(120, 220, 255, 0.08)';
  element.style.color = type === 'error' ? '#ffd6d6' : '#e8fbff';
}

function hideMessage(element) {
  if (!element) return;
  element.style.display = 'none';
}

function redirectIfAuthenticated() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = 'dashboard.html';
  }
}

function renderUserNav(user) {
  const greeting = document.getElementById('dashboardGreeting');
  const username = document.getElementById('dashboardUsername');
  const fullName = document.getElementById('dashboardFullName');
  const emailField = document.getElementById('dashboardEmail');
  const providerField = document.getElementById('dashboardProvider');
  const welcomeNotice = document.getElementById('welcomeNotice');

  if (!user) return;
  if (greeting) greeting.textContent = `Hi, ${user.username || user.fullName || 'Member'}`;
  if (username) username.textContent = user.username || 'Not set';
  if (fullName) fullName.textContent = user.fullName || 'Not set';
  if (emailField) emailField.textContent = user.email;
  if (providerField) providerField.textContent = user.provider || 'Email';
  if (welcomeNotice) welcomeNotice.textContent = 'You can update your username, full name, and profile photo below.';

  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar) {
    navAvatar.innerHTML = '';
    if (user.photo) {
      const img = document.createElement('img');
      img.src = user.photo;
      img.className = 'nav-avatar-img';
      img.alt = user.username || 'avatar';
      navAvatar.appendChild(img);
    } else {
      const initials = (user.fullName || user.username || 'U').split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
      navAvatar.textContent = initials;
    }
  }
}

function renderProfilePhoto(user) {
  const profilePhoto = document.getElementById('profilePhoto');
  const placeholder = document.getElementById('photoPlaceholder');
  if (!profilePhoto || !placeholder) return;

  if (user.photo) {
    profilePhoto.src = user.photo;
    profilePhoto.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    profilePhoto.style.display = 'none';
    placeholder.style.display = 'flex';
    const initials = (user.fullName || user.username || 'P').split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    placeholder.textContent = initials || 'P';
  }
}

function handleRegister(event) {
  event.preventDefault();
  const message = document.getElementById('registerMessage');
  hideMessage(message);

  const fullName = event.target.fullName.value.trim();
  const username = event.target.username.value.trim();
  const email = event.target.email.value.trim().toLowerCase();
  const password = event.target.password.value;

  if (!fullName || !username || !email || !password) {
    showMessage(message, 'Please fill in all registration fields.', 'error');
    return;
  }

  const users = getStoredUsers();
  if (users[email]) {
    showMessage(message, 'This email is already registered. Please log in or use another email.', 'error');
    return;
  }

  const user = {
    email,
    password,
    fullName,
    username,
    provider: 'Email',
    photo: '',
    createdAt: new Date().toISOString()
  };

  users[email] = user;
  saveStoredUsers(users);
  setCurrentUserEmail(email);
  window.location.href = 'dashboard.html';
}

function handleLogin(event) {
  event.preventDefault();
  const message = document.getElementById('loginMessage');
  hideMessage(message);

  const email = event.target.email.value.trim().toLowerCase();
  const password = event.target.password.value;
  const users = getStoredUsers();
  const user = users[email];

  if (!user || user.password !== password) {
    showMessage(message, 'Invalid email or password. Please try again.', 'error');
    return;
  }

  setCurrentUserEmail(email);
  window.location.href = 'dashboard.html';
}

function handleGoogleSignIn(event) {
  event.preventDefault();
  const email = prompt('Enter your Google email address');
  if (!email) return;

  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  let user = users[normalizedEmail];

  if (user) {
    setCurrentUserEmail(normalizedEmail);
    window.location.href = 'dashboard.html';
    return;
  }

  const fullName = prompt('Enter your full name as shown on Google');
  const rawUsername = prompt('Choose a username or press OK to use your name', fullName ? fullName.split(' ')[0].toLowerCase() : 'googleuser');
  const username = rawUsername ? rawUsername.trim() : (fullName ? fullName.split(' ')[0].toLowerCase() : `user${Date.now()}`);

  user = {
    email: normalizedEmail,
    password: '',
    fullName: fullName || username,
    username: username || 'googleuser',
    provider: 'Google',
    photo: '',
    createdAt: new Date().toISOString()
  };

  users[normalizedEmail] = user;
  saveStoredUsers(users);
  setCurrentUserEmail(normalizedEmail);
  window.location.href = 'dashboard.html';
}

function attachLoginPageEvents() {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const googleBtn = document.getElementById('googleBtn');

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleSignIn);
  }
}

function attachDashboardEvents() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const profileForm = document.getElementById('profileForm');
  const photoInput = document.getElementById('photoInput');

  renderUserNav(user);
  renderProfilePhoto(user);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (event) {
      event.preventDefault();
      clearCurrentUser();
      window.location.href = 'login.html';
    });
  }

  if (profileForm) {
    profileForm.username.value = user.username || '';
    profileForm.fullName.value = user.fullName || '';
    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      user.username = profileForm.username.value.trim() || user.username;
      user.fullName = profileForm.fullName.value.trim() || user.fullName;
      saveCurrentUser(user);
      renderUserNav(user);
      renderProfilePhoto(user);
      showMessage(document.getElementById('profileMessage'), 'Profile updated successfully.');
    });
  }

  if (photoInput) {
    photoInput.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (loadEvent) {
        user.photo = loadEvent.target.result;
        saveCurrentUser(user);
        renderProfilePhoto(user);
        showMessage(document.getElementById('profileMessage'), 'Profile photo uploaded successfully.');
      };
      reader.readAsDataURL(file);
    });
  }

  // Backup feature removed per user request
}

function initAuthPage() {
  if (document.getElementById('registerForm') || document.getElementById('loginForm')) {
    redirectIfAuthenticated();
    attachLoginPageEvents();
  }

  if (document.getElementById('dashboardGreeting')) {
    attachDashboardEvents();
  }
}

window.addEventListener('DOMContentLoaded', initAuthPage);

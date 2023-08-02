/* eslint-disable */
import 'core-js/stable';
import 'regenerator-runtime/runtime.js';
import { login } from './login.mjs';
import { displayMap } from './mapbox.mjs';
import { updateSettings } from './user.mjs';
import { bookTour } from './stripe.mjs';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form');
const logoutForm = document.querySelector('.logout-form');
const userDetailsForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const bookButton = document.getElementById('book-tour');

if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutForm) {
  logoutForm.addEventListener('click', (e) => {
    e.preventDefault();
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      e.currentTarget.submit();
    }
  });
}

if (userDetailsForm) {
  const image = document.querySelector('.form__user-photo');
  // Show preview of the selected image
  document
    .querySelector('.form__upload')
    .addEventListener('change', function (event) {
      image.src = URL.createObjectURL(this.files[0]);
    });

  // Initiate update operation on submit
  userDetailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(userDetailsForm);
    const user = await updateSettings(formData, 'data');
    // If new image is successfully uploaded, update image in nav bar too
    if (user) {
      document.querySelector('.nav__user-img').src = `/img/users/${user.photo}`;
      image.src = `/img/users/${user.photo}`;
    }
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    await updateSettings(
      { oldPassword, newPassword, confirmPassword },
      'password'
    );
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookButton) {
  bookButton.addEventListener('click', (e) => {
    e.target.textContent = 'processing';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}

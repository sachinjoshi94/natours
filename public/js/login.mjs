/* eslint-disable */
import { showAlert } from './alert.mjs';
export const login = async (email, password) => {
  try {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 2000);
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (err) {
    showAlert('error', err);
  }
};

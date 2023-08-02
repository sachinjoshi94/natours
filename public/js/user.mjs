/* eslint-disable */
import { showAlert } from './alert.mjs';

export const updateSettings = async (data, type) => {
  try {
    debugger;
    const headers =
      type === 'password' ? { 'Content-Type': 'application/json' } : {};
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      return result.data.user;
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};

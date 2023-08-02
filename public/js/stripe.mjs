/* eslint-disable */
import { showAlert } from './alert.mjs';
var stripe = Stripe(
  'pk_test_51NVcx5SCt1PSNomp2qfjhuAlHiM9GT76JRCH7foAedewUFRUtHNfLLr4MsEHpezTaBz0V2941iYjOwvK9IUThCpk00EtXIOt5Z'
);

export const bookTour = async (tourId) => {
  try {
    const response = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);
    const data = await response.json();
    console.log(data);

    await stripe.redirectToCheckout({
      sessionId: data.session.id,
    });
  } catch (e) {
    console.log(e);
    showAlert('error', e);
  }
};

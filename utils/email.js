const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Sachin Joshi <${
      process.env.NODE_ENV.trim() === 'production'
        ? process.env.PROD_EMAIL_FROM
        : process.env.EMAIL_FROM
    }>`;
  }

  newTransport() {
    if (process.env.NODE_ENV.trim() === 'production') {
      console.log('here');
      return this.createTransport(
        process.env.PROD_EMAIL_HOST,
        process.env.PROD_EMAIL_PORT,
        process.env.PROD_EMAIL_USERNAME,
        process.env.PROD_EMAIL_PASSWORD
      );
    }
    return this.createTransport(
      process.env.EMAIL_HOST,
      process.env.EMAIL_PORT,
      process.env.EMAIL_USERNAME,
      process.env.EMAIL_PASSWORD
    );
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert({ wordwrap: false }),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid only for 10 minutes)'
    );
  }

  createTransport(host, port, user, pass) {
    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }
};

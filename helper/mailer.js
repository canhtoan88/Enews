const nodemailer = require('nodemailer');
const hbs = require('express-handlebars');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  sucure: true,
  service: 'gmail',
  auth: {
    user: 'nctt96@gmail.com',
		pass: 'Canhtoan^88'
  }
})

/*transporter.use('compile', hbs({
  viewEngine: {
    extName: '.hbs',
    partialsDir: 'views/template',
    layoutsDir: 'views/template',
    defaultLayout: 'email.hbs',
  },
  viewPath: 'views/template',
  extName: '.hbs'
}))*/

module.exports = transporter;

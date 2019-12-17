const https         = require('https');
const express       = require('express');
const session       = require('express-session');
const bodyParser    = require('body-parser');
const fs            = require('fs');

const User          = require('./routers/user');
const Admin         = require('./routers/admin');
const Post          = require('./routers/post');
const Article       = require('./routers/article');
const Category      = require('./routers/category');
const Search        = require('./routers/search');

const app           = express();
//const port          = process.env.PORT || 8080;
const port          = process.env.PORT || 3000;

const options = {
    key: fs.readFileSync('./files/key.pem', 'utf-8'),
    cert: fs.readFileSync('./files/server.crt', 'utf-8'),
    ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES256-SHA384',
    honorCipherOrder: true,
    secureProtocol: 'TLSv1_2_method'
};

const server = https.createServer(options, app);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'canhtoan',
  resave: false,
  saveUninitialized: true
  /*cookie: {
  	maxAge: 3600000
  }*/
}));

app.use('/', User);
app.use('/index', User);
app.use('/admin', Admin);
app.use('/dangbai', Post);
app.use('/baiviet', Article);
app.use('/theloai', Category);
app.use('/timkiembaiviet', Search);
app.use((req, res, next) => {
    res.render('template/notfound');
});

//server.listen(port);
app.listen(port);

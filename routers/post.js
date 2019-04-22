const express = require('express');
const app = express.Router();

const slug = require('../helper/slug');
const upload = require('../helper/uploadfile');
const requiresignin = require('../helper/requiresignin');

const postsMD = require('../models/user');

app.get('/',function(req,res) {
	if (req.session.admin) {
		res.render('writting');
	} else {
		res.redirect('/admin');
	}
});

app.post('/', upload.single('file'), function(req,res) {
	if (req.session.admin) {
		const article = {
			kind 		: req.body.kind,
			title	: req.body.title,
			imagelink	: '/img/' + req.file.path.slice(11),
			content	: req.body.content,
			titleurl	: slug(req.body.title)
		}
	    postsMD.query(`INSERT INTO articles (kind, title, titleurl, imagelink, content, views, date) VALUES (${article.kind}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}', 0, NOW())`, function(err, posts) {
	    	if (err) {console.log(err);}
	    	else {
	    		res.render('writting');
	    	}
	    })
	} else {
		res.redirect('admin');
	}
});

module.exports = app;
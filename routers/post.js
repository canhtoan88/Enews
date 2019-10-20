const express = require('express');
const app = express.Router();

const requiresignin = require('../helper/requiresignin');

const postsMD = require('../models/user');

app.get('/',function(req,res) {
	if (req.session.admin) {
		res.render('writting');
	} else {
		res.redirect('/admin');
	}
});

/*app.post('/', upload.single('file'), function(req,res) {
	if (req.session.admin) {
		const article = {
			kind_id 		: req.body.kind,
			title	: req.body.title,
			imagelink	: '/img/' + req.file.path.slice(11),
			content	: req.body.content,
			titleurl	: slug(req.body.title)
		}
		// INSERT INTO articles (kind_id, title, titleurl, imagelink, content, views, date) VALUES (${article.kind}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}', 0, NOW())
	    postsMD.query(`select INSERT_ARTICLE_FN(${article.kind_id}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}')`, function(err, posts) {
	    	if (err) {console.log(err);}
	    	else {
	    		res.render('writting');
	    	}
	    })
	} else {
		res.redirect('admin');
	}
});*/

module.exports = app;
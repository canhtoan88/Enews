const app 		= require('express').Router();

const moment 	= require('moment');

const categoryMD = require('../models/user');

app.get('/:category',function(req,res) {
	const kind = req.params.category;
    const category = {
    	"cong-nghe": 1,
    	"bong-da": 2,
    	"du-lich": 3,
    	"suc-khoe": 4
    }

    // Get articles follow category
    categoryMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and kind = ${category[kind]}`, (err, results) => {
    	if (err) console.log(err);
    	if (req.isAuthenticated()) {
    		res.render('category', {user: req.user, results, tab: category[kind], moment});
    	} else {
    		res.render('category', {user: null, results, tab: category[kind], moment});
    	}
    })
});

module.exports = app;
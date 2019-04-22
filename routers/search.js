const app = require('express').Router();

const moment = require('moment');

const searchMD 			= require('../models/user');
const checkArticleExist = require('../models/checkArticleExist');

app.post('/',function(req,res) {
	// Get search's content
	const searchContent = req.body.searchContent;

	// Get articles follow client's require
	searchMD.query(`select articles.id, kind, title, titleurl, imagelink, content, views, date, kindname, kindurl from articles, kind where title like '%${searchContent}%' and articles.kind = kind.id`, (err, results) => {
		if (err) console.log(err);
		else {
			const user = (req.user) ? req.user : null;

			// Split search's content
			const arrSearchContent = searchContent.split(' ');
			var strSearchContent = '%';
			for (let s of arrSearchContent) {
				strSearchContent += s + '%';
			}
			// Search from article's content
			searchMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where content like '${strSearchContent}' and articles.kind = kind.id`, (err, result) => {
				// Push search's results from article's content into results from title
				for (let i = 0; i < result.length; i++) {
					if (checkArticleExist.found(result[i], results)){
						result.splice(i, 1);
						i--;
					}
				}
				results = results.concat(result);
				if (results.length == 0) {
					res.render('template/notfound', {user});
				} else {
					if (results.length < 3) {
						searchMD.query(`select * from articles where date > (SELECT DATE_ADD(CURDATE(), INTERVAL '-7' DAY)) order by views desc limit 6`, (err, interest) => {
							if (err) {
								console.log(err);
							} else {
								// Delete the same articles
								for (let i = 0; i < interest.length; i++){
									if (checkArticleExist.found(interest[i], results)){
										interest.splice(i, 1);
										i--
									}
								}

								// Get only 4 articles
								interest = interest.slice(0, 4);

								// Render
								res.render('found', {user, moment, results, interest, searchContent});
							}
						})
					} else {
						res.render('found', {user, moment, results, interest: null, searchContent});
					}
				}
			})
		}
	})
});

module.exports = app;
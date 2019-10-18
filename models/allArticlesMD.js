
const moment = require('moment');

module.exports = (res, checkArticleExist, user, userMD) => {
	// Declare articles array
    var allArticles = [];

    // Get articles follow category Công nghệ
    userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and kind = 1 order by date desc limit 4`, (err, article_kind1) => {
    	if (err) {
    		console.log(err);
    	} else {
    		allArticles = allArticles.concat(article_kind1);
		    // Get articles follow category Bóng đá
		    userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and kind = 2 order by date desc limit 4`, (err, article_kind2) => {
		    	if (err) {
		    		console.log(err);
		    	} else {
		    		allArticles = allArticles.concat(article_kind2);
				    // Get articles follow category Du lịch
				    userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and kind = 3 order by date desc limit 4`, (err, article_kind3) => {
				    	if (err) {
				    		console.log(err);
				    	} else {
				    		allArticles = allArticles.concat(article_kind3);
						    // Get articles follow category Sức khoẻ
						    userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and kind = 4 order by date desc limit 4`, (err, article_kind4) => {
						    	if (err) {
						    		console.log(err);
						    	} else {
						    		allArticles = allArticles.concat(article_kind4);
						    		// Get new articles
								    userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id order by date desc limit 26`, (err, newArticles) => {
								    	if (err) {
								    		console.log(err);
								    	} else {
								    		// Delete dulicated articles
								    		for (var i = 0; i < 4; i++){
								    			for (var j = i * 4; j < (i * 4 + 4); j++) {
								    				checkArticleExist.allArticles(allArticles[j], newArticles)
								    			}
								    		}

								    		// Get articles that have a lot of interest in the last 30 days
								    		userMD.query(`select articles.id, kind, title, titleurl, imagelink, content, date, views, kindname, kindurl from articles, kind where articles.kind = kind.id and date > (SELECT DATE_ADD(CURDATE(), INTERVAL '-365' DAY)) order by views desc limit 10`, (err, interests) => {
								    			if (err) {
								    				console.log(err);
								    			} else {

										    		// Push articles at the begining of all articles
										    		allArticles.unshift(...interests);
										    		allArticles.unshift(...newArticles.slice(0, 11));

								    				res.render('index', {user, allArticles, moment});
								    			}
								    		})
								    	}
								    })
						    	}
						    })
				    	}
				    })
		    	}
		    })
    	}
	})
}

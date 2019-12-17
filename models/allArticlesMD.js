
const moment = require('moment');

module.exports = (res, checkArticleExist, user, userMD) => {
	// Declare articles array
    var allArticles = [];

    // Update datetime to now of articles
    userMD.query(`update articles set date = now() where now() - date < 30`, err => {
    	if (err) {
    		console.log(err);
    	}
    });

    // Get articles follow category Công nghệ
    userMD.query(`call FIND_ARTICLES_FOLLOW_CATEGORY_PROC(1)`, (err, article_kind1) => {
    	if (err) {
    		console.log(err);
    	} else {
    		allArticles = allArticles.concat(article_kind1[0]);
		    // Get articles follow category Bóng đá
		    userMD.query(`call FIND_ARTICLES_FOLLOW_CATEGORY_PROC(2)`, (err, article_kind2) => {
		    	if (err) {
		    		console.log(err);
		    	} else {
		    		allArticles = allArticles.concat(article_kind2[0]);
				    // Get articles follow category Du lịch
				    userMD.query(`call FIND_ARTICLES_FOLLOW_CATEGORY_PROC(3)`, (err, article_kind3) => {
				    	if (err) {
				    		console.log(err);
				    	} else {
				    		allArticles = allArticles.concat(article_kind3[0]);
						    // Get articles follow category Sức khoẻ
						    userMD.query(`call FIND_ARTICLES_FOLLOW_CATEGORY_PROC(4)`, (err, article_kind4) => {
						    	if (err) {
						    		console.log(err);
						    	} else {
						    		allArticles = allArticles.concat(article_kind4[0]);
						    		// Get new articles
								    userMD.query(`call FIND_LASTEST_ARTICLES_PROC`, (err, newArticles) => {
								    	if (err) {
								    		console.log(err);
								    	} else {
								    		// Delete dulicated articles
								    		for (var i = 0; i < 4; i++){
								    			for (var j = i * 4; j < (i * 4 + 4); j++) {
								    				checkArticleExist.allArticles(allArticles[j], newArticles[0])
								    			}
								    		}

								    		// Get articles that have a lot of interest in the last 30 days
								    		userMD.query(`call FIND_INTERESTED_ARTICLES_PROC(10)`, (err, interests) => {
								    			if (err) {
								    				console.log(err);
								    			} else {

										    		// Push articles at the begining of all articles
										    		allArticles.unshift(...interests[0]);
										    		allArticles.unshift(...newArticles[0].slice(0, 11));

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

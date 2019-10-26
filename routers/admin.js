const express 	= require('express');
const app 		= express.Router();
const moment    = require('moment');
moment.locale('vi');

const upload = require('../helper/uploadfile');
const slug = require('../helper/slug');

const adminMD			= require('../models/user');

app.get('/',function(req,res) {
	if (req.session.admin) {
		let total = {
			articles: 0,
			accounts: 0,
			comments: 0,
			views: 0
		};
		// Select total and new articles
		adminMD.query(`select * from totalArticles`, (err, totalArticles) => {
			total.articles = totalArticles[0].sumArticles;
		})
		adminMD.query(`select * from newArticles`, (err, newArticles) => {
			total.newArticles = newArticles[0].sum;
		})
		// Select total and new accounts
		adminMD.query(`select * from totalAccounts`, (err, totalAccounts) => {
			total.accounts = totalAccounts[0].sumUsers;
		})
		adminMD.query(`select * from newAccounts`, (err, newAccounts) => {
			total.newAccounts = newAccounts[0].sum;
		})
		// Select total and new comments
		adminMD.query(`select * from totalComments`, (err, totalComments) => {
			total.comments = totalComments[0].sumComments;
		})
		adminMD.query(`select * from newComments`, (err, newComments) => {
			total.newComments = newComments[0].sum;
		})
		// Select total and new views
		adminMD.query(`select * from totalViews`, (err, totalViews) => {
			total.views = totalViews[0].sumViews;
		})
		adminMD.query(`select * from newViews`, (err, newViews) => {
			total.newViews = newViews[0].sum;
		})
		
		// Select all admin accounts
		const admin = req.session.admin;
		adminMD.query(`call FIND_ADMINS_PROC('${admin.username}')`, (err, admins) => {
			res.render('admin', {admin, admins: admins[0], total})
		})
	} else res.render('admin_login');
});

app.post('/', function(req,res) {
	adminMD.query(`call FIND_ADMIN_PROC('${req.body.username}', '${req.body.password}')`, (err, admin) => {
		if (admin[0][0]){
			req.session.admin = admin[0][0];
			res.redirect('admin');
		} else {
			res.redirect('admin');
		}
	})
});

app.get('/logout',function(req,res) {
    req.session.admin = null;
    res.redirect('/admin');
});

app.post('/addAdminAccount', function(req,res) {
	const admin = {
		fullname: req.body.fullname,
		phone: req.body.phone,
		username: req.body.username,
		email: req.body.email,
		password: req.body.password
	}
	
	adminMD.query(`select ADD_ADMIN_ACCOUNT_FN('${admin.fullname}', '${admin.phone}', '${admin.username}', '${admin.email}', '${admin.password}')`, (err, result) => {
		if (err) {
			res.status(201).json(err.sqlMessage);
		}
		else {
			res.status(200).json(admin);
		}
	})
});

app.get('/deleteAdmin',function(req,res) {
    const id = req.query.id;
    adminMD.query(`select REMOVE_ADMIN_FN(${id})`, (err, result) => {
    	res.redirect('/admin');
    })
});

app.get('/writing',function(req,res) {
    if (req.session.admin) {
    	res.render('adminWriting', {admin: req.session.admin, action: 'writting', article: {}});
    } else res.redirect('/admin');
});

app.post('/writing', upload.single('file'), function(req,res) {
    if (req.session.admin) {
		const article = {
			kind_id 	: req.body.kind,
			title		: req.body.title,
			imagelink	: '/img/' + req.file.path.slice(11),
			content		: req.body.content,
			titleurl	: slug(req.body.title)
		}
		// INSERT INTO articles (kind_id, title, titleurl, imagelink, content, views, date) VALUES (${article.kind}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}', 0, NOW())
	    adminMD.query(`select INSERT_ARTICLE_FN(${article.kind_id}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}')`, function(err, posts) {
	    	if (err) {console.log(err);}
	    	else {
	    		res.render('adminWriting', {admin: req.session.admin, action: 'writting', article: {}});
	    	}
	    })
	} else {
		res.redirect('/admin');
	}
});

app.get('/accounts',function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_USERS_PROC`, (err, users) => {
			res.render('adminAccount', {admin: req.session.admin, users: users[0]});
		})
	} else res.redirect('/admin');
});

app.get('/deleteUser',function(req,res) {
	if (req.session.admin) {
    	adminMD.query(`select DELETE_USER_FN('${req.query.id}')`, err => {
	    	res.redirect('Accounts');
	    })
	} else res.redirect('/admin');
});

app.get('/articles',function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_ARTICLES_PROC`, (err, articles) => {
			res.render('adminArticle', {admin: req.session.admin, articles: articles[0], moment});
		})
	} else res.redirect('/admin');
});

app.get('/updateArticle',function(req,res) {
	if (req.session.admin) {
		const id = req.query.id;
	    adminMD.query(`call FIND_ARTICLE_INFO_PROC(${id})`, (err, article) => {
	    	res.render('adminWriting', {admin: req.session.admin, action: 'updateArticle', article: article[0][0]});
	    })
	} else res.redirect('/admin');
});

app.post('/updateArticle', upload.single('file'), function(req,res) {
	if (req.session.admin) {
		const id = req.body.id,
			title = req.body.title,
			content = req.body.content;
			
	    adminMD.query(`select UPDATE_ARTICLE_FN(${id}, '${title}', '${content}')`, (err, result) => {
	    	res.redirect('Articles');
	    })
	} else res.redirect('/admin');
});

app.post('/deleteArticle',function(req,res) {
	if (req.session.admin) {
		const id = req.body.id;
	    adminMD.query(`select DELETE_ARTICLE_FN(${id})`, err => {
	    	if (err) {
	    		console.log(err);
	    	}
	    	res.redirect('Articles');
	    })
    } else res.redirect('/admin');
});

app.get('/comments',function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_COMMENTS_PROC`, (err, comments) => {
			res.render('adminComment', {admin: req.session.admin, comments: comments[0], moment});
		})
	} else res.redirect('/admin');
});

app.get('/deleteComment',function(req,res) {
    if (req.session.admin) {
		adminMD.query(`select DELETE_COMMENT_FN(${req.query.id})`, (err, comments) => {
			res.redirect('comments');
		})
	} else res.redirect('/admin');
});

app.get('/views',function(req,res) {
	 if (req.session.admin) {
	    adminMD.query(`call FIND_ALL_VIEWS_ARTICLES_PROC`, (err, views) => {
	    	adminMD.query(`call FIND_USER_VIEW_MANY_ARTICLES_PROC`, (err, topViews) => {
	    		res.render('adminView', {admin: req.session.admin, views: views[0], topViews: topViews[0], moment});
	    	})
	    })
	} else res.redirect('/admin');
});


module.exports = app;

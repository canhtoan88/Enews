const express 	= require('express');
const app 		= express.Router();
const moment    = require('moment');
const config 	= require('config');
moment.locale('vi');

const upload = require('../helper/uploadfile');
const slug = require('../helper/slug');

//const adminMD	= require('../models/user');
const adminConnectMD 	= require('../models/admin');

let adminMD, error = '', notify = '';

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

		// Count notifies don't read yet
		adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
			total.notifies = result[0][0].total;
		})
		
		// Select all admin accounts
		const admin = req.session.admin;
		adminMD.query(`call FIND_ADMINS_PROC('${admin.username}')`, (err, admins) => {
			res.render('admin', {admin, admins: admins[0], total})
		})
	} else res.render('admin_login');
});

app.post('/', async function(req,res) {
	let user = req.body.username;
	let password = 'Canhtoan88';
	if (user === 'root' || user === 'admin') {
		user = 'root';
		username = 'admin'
	} else {
		username = user;
		password = 'Enews' + req.body.password;
	}

	adminMD = await adminConnectMD(user, password);

	adminMD.query(`call FIND_ADMIN_PROC('${username}', '${password}')`, (err, admin) => {
		if (admin && admin[0][0]){
			req.session.admin = admin[0][0];
			res.redirect('admin');
		} else {
			adminMD.end();
			adminMD = null;
			res.redirect('admin');
		}
	})
});

app.get('/logout',function(req,res) {
	if (req.session.admin && adminMD) {
	    req.session.admin = null;
	    adminMD.end();
		adminMD = null;
	    res.redirect('/admin');
	} else res.redirect('/admin');
});

app.post('/addAdminAccount', function(req,res) {
	if (req.session.admin) {
		const admin = {
			fullname: req.body.fullname,
			phone: req.body.phone,
			username: req.body.username,
			email: req.body.email,
			password: 'Enews' + req.body.password
		}
		adminMD.beginTransaction(err => {
			if (err) {throw err}

			adminMD.query(`select ADD_ADMIN_ACCOUNT_FN('${admin.fullname}', '${admin.phone}', '${admin.username}', '${admin.email}', '${admin.password}')`, (err, result) => {
				if (err) {
					adminMD.rollback(() => {
						res.status(201).json(err.sqlMessage);
					})
				}
				else {
					// Phân quyền cho Admin
					adminMD.query(`CREATE USER '${admin.username}'@'localhost' IDENTIFIED BY '${admin.password}'`, async err => {
						if (err) {
							adminMD.rollback(() => {
								throw err;
							})
						}
					})
					adminMD.query(`GRANT select, execute ON ${config.get('mysql.database')}.* TO '${admin.username}'@'localhost'`, async err => {
						if (err) {
							adminMD.rollback(() => {
								throw err;
							})
						}
					})
					adminMD.query(`ALTER USER '${admin.username}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${admin.password}'`, async err => {
						if (err) {
							adminMD.rollback(() => {
								throw err;
							})
						}
					});
					adminMD.query(`FLUSH PRIVILEGES`, async err => {
						if (err) {
							adminMD.rollback(() => {
								throw err;
							})
						}
					});
					adminMD.commit(err => {
						if (err) {
							adminMD.rollback(() => {
								throw err;
							})
						}
						res.status(200).json(admin);
					})
				}
			})

		});
	} else res.redirect('/admin');
});

app.get('/deleteAdmin',function(req,res) {
	if (req.session.admin) {
	    const id = req.query.id;
	    adminMD.beginTransaction(err => {
	    	if (err) {
	    		throw err
	    	}

		    adminMD.query(`call FIND_ADMIN_BY_ID_PROC('${id}')`, (err, admin) => {
		    	if (err) {
		    		adminMD.rollback(() => {
		    			throw err;
		    		})
		    	}
				if (admin && admin[0][0]){
					const username = admin[0][0].username;
				    adminMD.query(`SELECT REMOVE_ADMIN_FN(${id})`, (err, result) => {
				    	if (err) {
				    		adminMD.rollback(() => {
				    			throw err;
				    		})
				    	}
				    	adminMD.query(`DROP USER '${username}'@'localhost'`, err => {
				    		if (err) {
				    			adminMD.rollback(() => {
				    				throw err;
				    			})
				    		}
				    		adminMD.commit(err => {
				    			if (err) {throw err}
				    			res.redirect('/admin');
				    		})
				    	})
				    })
				} else {
					res.redirect('/admin');
				}
			})
	    })
     } else res.redirect('/admin');
});

app.get('/writing',function(req,res) {
    if (req.session.admin) {
    	adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
			const noReadNotifies = result[0][0].total;
    		res.render('adminWriting', {admin: req.session.admin, action: 'writing', article: {}, noReadNotifies, notify: ''});
		})
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
	    adminMD.query(`select INSERT_ARTICLE_FN(${article.kind_id}, '${article.title}', '${article.titleurl}', '${article.imagelink}', '${article.content}', ${req.session.admin.id})`, function(err, posts) {
	    	if (err) {console.log(err);}
	    	else {
	    		const content = `Bạn vừa đăng bài viết thành công!`
	            adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
	                if (err) {console.log(err)}
	    			notify = 'Bài viết đã được đăng thành công!';
	    			adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
						const noReadNotifies = result[0][0].total;
		    			res.render('adminWriting', {admin: req.session.admin, action: 'writing', article: {}, noReadNotifies, notify});
					})
	            })
	    	}
	    })
	} else {
		res.redirect('/admin');
	}
});

app.get('/accounts',function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_USERS_PROC`, (err, users) => {
			// Count notifies don't read yet
			adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
				const noReadNotifies = result[0][0].total;
				res.render('adminAccount', {admin: req.session.admin, users: users[0], noReadNotifies});
			})
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
			// Count notifies don't read yet
			adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
				const noReadNotifies = result[0][0].total;
				res.render('adminArticle', {admin: req.session.admin, articles: articles[0], noReadNotifies, moment, error});
				error = '';
			})
		})
	} else res.redirect('/admin');
});

app.get('/updateArticle',function(req,res) {
	if (req.session.admin) {
		const id = req.query.id;
	    adminMD.query(`call FIND_ARTICLE_INFO_PROC(${id})`, (err, article) => {
	    	if (article[0][0].creater === req.session.admin.id) {
	    		// Count notifies don't read yet
				adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
					const noReadNotifies = result[0][0].total;
		    		res.render('adminWriting', {admin: req.session.admin, action: 'updateArticle', article: article[0][0], noReadNotifies});
					error = '';
				})
	    	} else {
	    		error = `*Bạn không được phép chỉnh sửa bài viết ${id}!`
	    		res.redirect('Articles');
	    	}
	    })
	} else res.redirect('/admin');
});

app.post('/updateArticle', upload.single('file'), function(req,res) {
	if (req.session.admin) {
		const id = req.body.id,
			title = req.body.title,
			content = req.body.content;
			
	    adminMD.query(`select UPDATE_ARTICLE_FN(${id}, '${title}', '${content}')`, (err, result) => {
    		const content = `Bạn đã chỉnh sửa nội dung bài viết ${id}`
            adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
                if (err) {console.log(err)}
            })
	    	res.redirect('Articles');
	    })
	} else res.redirect('/admin');
});

app.post('/deleteArticle',function(req,res) {
	if (req.session.admin) {
		const id = req.body.id;
		const kind_id = req.body.kind_id;
	    /*adminMD.query(`select DELETE_ARTICLE_FN(${id})`, err => {
	    	if (err) {
	    		console.log(err);
	    	}
	    	res.redirect('Articles');
	    })*/

	    adminMD.beginTransaction(err => {
	    	if (err) {
	    		throw err;
	    	}
	    	// Delete article
	    	adminMD.query(`select DELETE_ARTICLE_FN(${id})`, err => {
		    	if (err) {
		    		adminMD.roolback(() => {
		    			throw err;
		    		})
		    	}
		    })

		    // Check articles quantity
		    adminMD.query(`call FIND_TOTAL_ARTICLES_PROC(${kind_id})`, (err, result) => {
		    	if (err) {
		    		adminMD.roolback(() => {
		    			throw err;
		    		})
		    	}

		    	// Check article quantity
		    	if (result[0][0].total < 11) {
		    		// Abort transaction if total articles < 11
		    		adminMD.rollback(() => {
		    			error = `*Bài viết ${id} không được phép xóa vì số lượng bài viết thấp!`
		    			res.redirect('Articles');
		    		})
		    	} else {
			    	// Commit transaction
			    	adminMD.commit(err => {
			    		if (err) {
			    			adminMD.roolback(() => {
				    			throw err;
				    		})
			    		}
			    		const content = `Bạn đã xóa bài viết ${id}`
			            adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
			                if (err) {console.log(err)}
			            })
			    		res.redirect('Articles');
			    	})
		    	}
		    })
	    })
    } else res.redirect('/admin');
});

app.get('/comments',function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_COMMENTS_PROC`, (err, comments) => {
			// Count notifies don't read yet
			adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
				const noReadNotifies = result[0][0].total;
				res.render('adminComment', {admin: req.session.admin, comments: comments[0], noReadNotifies, moment});
			})
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
	    		adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
					const noReadNotifies = result[0][0].total;
	    			res.render('adminView', {admin: req.session.admin, views: views[0], topViews: topViews[0], noReadNotifies, moment});
				})
	    	})
	    })
	} else res.redirect('/admin');
});

app.get('/notification', function(req,res) {
	if (req.session.admin) {
		adminMD.query(`call FIND_ALL_NOTIFYCATIONS_PROC(${req.session.admin.id})`, (err, notifies) => {
			// Count notifies don't read yet
			adminMD.query(`call COUNT_NOTIFY_DONT_READ_YET_PROC(${req.session.admin.id})`, (err, result) => {
				const noReadNotifies = result[0][0].total;
				res.render('adminNotifycation', {admin: req.session.admin, notifies: notifies[0], noReadNotifies, moment});
			})
		})
	} else res.redirect('/admin');
});

app.get('/readnotify',function(req,res) {
	if (req.session.admin) {
	    const id = req.query.id;
	    adminMD.query(`select READ_NOTIFY_FN(${id})`, err => {
	    	if (err) console.log(err);
	    	return res.status(200).json({"OK": "OK"})
	    })
	} else res.redirect('/admin');
});

app.get('/readAllNotifies',function(req,res) {
	if (req.session.admin) {
	    adminMD.query(`select READ_ALL_NOTIFIES_FN(${req.session.admin.id})`, err => {
	    	if (err) console.log(err);
	    	return res.status(200).json({"OK": "OK"})
	    })
    } else res.redirect('/admin');
});

app.get('/deleteAllNotify',function(req,res) {
	if (req.session.admin) {
	    adminMD.query(`select DELETE_ALL_NOTIFIES_FN(${req.session.admin.id})`, err => {
	    	if (err) console.log(err);
	    	res.redirect('Notification');
	    })
    } else res.redirect('/admin');
});

app.get('/createtable',function(req,res) {
	if (req.session.admin) {
    	adminMD.query('create table newstable(id int primary key)', err => {
    		if (err) {
    			let content
    			if (err.sqlState === '42S01') {
    				content = `Bảng đã tồn tại!`
    			} else {
    				content = `Tài khoản chưa có quyền thêm bảng mới!`;
    			}

    			adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
	                if (err) {console.log(err)}
	                res.redirect('Notification');
	            })
    		} else {
    			const content = `Đã thêm một bảng mới vào cơ sở dữ liệu.`;
    			adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
	                if (err) {console.log(err)}
	                res.redirect('Notification');
	            })
    		}
    	});
	} else res.redirect('/admin');
});

app.get('/droptable',function(req,res) {
    if (req.session.admin) {
    	adminMD.query('drop table newstable', err => {
			if (err) {
    			const content = `Tài khoản chưa có quyền xóa bảng!`;
    			adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
	                if (err) {console.log(err)}
	                res.redirect('Notification');
	            })
    		} else {
    			const content = `Đã xóa một bảng trong cơ sở dữ liệu.`;
    			adminMD.query(`select ADD_NOTIFY_FN('${content}', ${req.session.admin.id})`, err => {
	                if (err) {console.log(err)}
	                res.redirect('Notification');
	            })
    		}
    	});
	} else res.redirect('/admin');
});

app.get('/*',function(req,res) {
    res.redirect('/admin');
});

module.exports = app;

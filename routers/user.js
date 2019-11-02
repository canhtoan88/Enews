const express 			= require('express');
const app 				= express.Router();
const passport 			= require('passport');
const LocalStrategy 	= require('passport-local').Strategy;
const FacebookStrategy 	= require('passport-facebook').Strategy;
const GoogleStrategy 	= require('passport-google-oauth20').Strategy;
const config 			= require('config');

const bcrypt 			= require('../helper/bcrypt');
const mailer 			= require('../helper/mailer');
const uid 				= require('uid');

const userMD 			= require('../models/user');
const checkArticleExist = require('../models/checkArticleExist');
const allArticlesMD		= require('../models/allArticlesMD');

var errSignup 	= null,
	errSignin	= null,
	changeInfo	= null,
	notify		= null;

app.use(passport.initialize());
app.use(passport.session());

app.get('/',function(req,res) {
    const user = (req.isAuthenticated()) ? req.user : null;
    allArticlesMD(res, checkArticleExist, user, userMD);
});

app.get('/dangnhap', (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect('/');
	} else {
		if (req.session.remember) {
			res.render('signin', {errSignin, remember: req.session.remember});
		} else {
			res.render('signin', {errSignin, remember: false});
		}
		errSignin = null;
	}
});

app.post('/dangnhap', passport.authenticate('local', {failureRedirect: '/dangnhap'}), (req, res) => {
	if (req.body.remember) {
		req.session.remember = {
			username: req.body.username,
			password: req.body.password
		}
	} else {
		req.session.remember = null;
	}
	if (req.session.url) {
		const url = req.session.url;
		req.session.url = null;
		res.redirect(url);
	}
	else
		res.redirect('/');
});

app.get('/auth/facebook', passport.authenticate('facebook', {authType: 'rerequest', scope: ['email', 'user_friends', 'manage_pages']}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/dangnhap'}), (req,res) => {
	if (req.session.url) {
		const url = req.session.url;
		req.session.url = null;
		res.redirect(url);
	} else {
		res.redirect('/index');
	}
});

app.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/dangnhap'}), (req,res) => {
    if (req.session.url) {
		const url = req.session.url;
		req.session.url = null;
		res.redirect(url);
	} else {
		res.redirect('/index');
	}
});

passport.use(new FacebookStrategy({
	clientID: '735019396847561',
	clientSecret: '2317cb5b3053e11e5634dee59d110007',
	callbackURL: `${config.get('host')}/auth/facebook/callback`,
	enableProof: true,
	profileFields: ['email', 'displayName'] // id, photos
}, (accessToken, refreshToken, profile, cb) => {
	var user = {
		fullname: profile.displayName,
		email: profile._json.email
	}
	if (user.email) {
		res.render('dangnhap', {errSignin: 'Đăng nhập thất bại', remember: null});
	}
	userMD.query(`call FIND_USER_BY_EMAIL_PROC('${user.email}')`, (err, result) => {
		if (err) {
			console.log(err);
		} else {
			if (result.length > 0) {
				cb(null, result[0]);
			} else {
				user.id = uid(10);
				userMD.query(`select INSERT_USER_FN('${user.id}', '${user.email}', '', '${user.fullname}', 0, 1, 0)`, (err) => {
					if (err) {
						console.log(err);
					} else {
						user.password = '',
						user.views = 0,
						user.comment = 0
						cb(null, user);
					}
				})
			}
		}
	})
}))

passport.use(new GoogleStrategy({
	clientID: '415311431370-b9cl76j8agmb034jeik1ej5scaf9t0g0.apps.googleusercontent.com',
	clientSecret: 'pugCdLYlVNBClU1vRCbssdmU',
	callbackURL: `${config.get('host')}/auth/google/callback`
}, (accessToken, refreshToken, profile, cb) => {
	var user = {
		fullname: profile.name.familyName + ' ' + profile.name.givenName,
		email: profile.emails[0].value
	}
	userMD.query(`call FIND_USER_BY_EMAIL_PROC('${user.email}')`, (err, result) => {
		if (err) {
			console.log(err);
		} else {
			if (result.length > 0) {
				cb(null, result[0]);
			} else {
				user.id = uid(10);
				userMD.query(`select INSERT_USER_FN('${user.id}', '${user.email}', '', '${user.fullname}', 0, 1, 0)`, (err) => {
					if (err) {
						console.log(err);
					} else {
						user.password = '';
						user.views = 0;
						user.comment = 0;
						cb(null, user);
					}
				})
			}
		}
	})
}))

app.get('/dangxuat',function(req,res) {
    req.logout();
    res.redirect('/');
});

app.get('/dangky', (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect('/');
	} else {
		res.render('signup', {errSignup});
		errSignup = null;
	}
});

// Sign in an account
app.post('/dangky', (req, res) => {
	let user = {
		id 			: uid(10),
		fullname 	: req.body.fullname,
		password	: bcrypt.hashPassword(req.body.password),
		email 		: req.body.username
	}

	// Check email or phone is existing
	// Can use findOrCreate
	userMD.query(`select INSERT_USER_FN('${user.id}', '${user.email}', '${user.password}', '${user.fullname}')`, function(err, result) {
		if (err) {
			errSignup = 'Email đã được đăng ký ở một tài khoản khác';
			res.redirect('/dangky');
		}
		else {
			// Message config
			const mailOption = {
				sender: 'Enews',
				to: user.email,
				subject: 'Xác thực tài khoản',
				html: `<h3>Click vào <a href="${config.get('host')}/xacthuc-${user.id}">đây</a> để xác thực tài khoản</h3>`
			}
			// Send mail
			mailer.sendMail(mailOption, function(err, info) {
				if (err) {
					console.log(err);
				} else {
					//console.log(info.response);
				}
			})
			res.render('sitemove', {content: 'Một <a href="https://mail.google.com" target="blank">email</a> xác thực đã gửi vào hộp thư của bạn!'});
		}
	})
});

app.get('/xacthuc-:id', (req, res) => {
	userMD.query(`call FIND_USER_BY_ID_PROC('${req.params.id}')`, function(err, result) {
		if (result[0][0]) {
			result[0] = result[0][0];
			if (result[0].state == 1) {
				res.json('Yêu cầu xác thực không thành công do tài khoản đã được xác thực từ trước!');
			} else {
				// update users set state = 1 where id = '${result[0].id}'
				userMD.query(`select VERIFY_USER_FN('${result[0].id}')`, (err) => {
				if (req.isAuthenticated())
					req.session.passport.user.state = true;
				res.render('sitemove', {content: 'Tài khoản đã được xác thực!'});
			})
			}
		} else {
			res.render('sitemove', {content: 'Tài khoản cần xác thực không được tìm thấy!'});
		}
	})
});

// Forgot password
app.get('/quenmatkhau', (req, res) => {
  res.render('forgotpassword');
});

// Forgot password
app.post('/quenmatkhau', (req, res) => {
  // Check email existing
	const email = req.body.email;
	userMD.query(`call FIND_USER_BY_EMAIL_PROC('${email}')`, function(err, user) {
		if (err) {
			console.log(err);
		} else {
			if (user[0][0]) {
				const mailOption = {
					sender: 'IShare',
					to: email,
					subject: 'Cấp lại mật khẩu',
					html: `<h3>Bạn quên mật khẩu?</h3>
						<p>Click vào <a href="${config.get('host')}/caplaimatkhau-${user[0][0].email}">đây</a> để lấy lại mật khẩu</p>`
				}
				mailer.sendMail(mailOption, function(err, result) {
					if (err) {
						console.log(err);
					} else {
						res.render('sitemove', {content: 'Vui lòng kiểm tra email để nhập mật khẩu mới!'});
					}
				})
			}
		}
	})
});

// Re-password
app.get('/caplaimatkhau-:email', (req, res) => {
	res.render('renewpassword', {email: req.params.email});
});

// Re-password
app.post('/caplaimatkhau', (req, res) => {
  	const email 	= req.body.email,
		password 	= bcrypt.hashPassword(req.body.password);
	userMD.query(`select UPDATE_PASSWORD_USER_FN('${password}', '${email}')`, function(err) {
		if (err) {
			console.log(err);
		} else {
			res.render('sitemove', {content: 'Cấp lại mật khẩu thành công!'});
		}
	})
});

// View user's profile
app.get('/thongtintaikhoan-:tab-:id', (req, res) => {
	if (req.isAuthenticated()) {
		const tab = req.params.tab;
		if (req.user.id == req.params.id){
			// Get saved articles from present user
			userMD.query(`call FIND_SAVED_PROC('${req.user.id}')`, function(err, saved) {
				if (saved[0] && saved[0].length > 0)
					res.render('profile', {user: req.user, changeInfo, tab, saved: saved[0]});
				else
					res.render('profile', {user: req.user, changeInfo, tab, saved: null});
			})
		} else {
			res.redirect('/thongtintaikhoan-' + tab + '-' + req.user.id);
		}
	} else {
		res.redirect('/dangnhap');
	}
});

app.post('/thaydoithongtin', (req, res) => {
  const user = {
		email: req.body.email,
		fullname: req.body.fullname
	}
	// Resave session then change their profile
	req.session.passport.user.fullname = user.fullname;
	userMD.query(`select UPDATE_INFO_USER_FN('${user.fullname}', '${user.email}')`, function(err, result) {
		if (err) {
			console.log(err);
		} else {
			changeInfo = 'Thay đổi thông tin thành công!';
			res.redirect(`/thongtintaikhoan-2-${req.user.id}`);
		}
	})
});

app.post('/doimatkhau', (req, res) => {
	const email 	= req.body.email,
		password 	= req.body.password,
		newpassword = bcrypt.hashPassword(req.body.newpassword);
	// Find account want to change the their password
	userMD.query(`call FIND_OLD_PASSWORD_PROC('${email}')`, function(err, oldPassword) {
		if (err) {
			console.log(err);
		} else {
			// Compare new and old password
			if (bcrypt.comparePassword(password, oldPassword[0][0].password)) {
				userMD.query(`select UPDATE_PASSWORD_USER_FN('${newpassword}', '${email}')`, function(err) {
					if (err) {
						console.log(err);
					} else {
						changeInfo = 'Mật khẩu đã được thay đổi';
						res.redirect(`/thongtintaikhoan-3-${req.user.id}`);
					}
				})
			} else {
				changeInfo = 'Mật khẩu cũ không chính xác';
				res.redirect(`/thongtintaikhoan-3-${req.user.id}`);
			}
		}
	})
});

// Sign in with account from sign up
passport.use(new LocalStrategy((username, password, done) => {
	userMD.query(`call FIND_USER_BY_EMAIL_PROC('${username}')`, function(err, user) {
		if (err) {console.log(err);}
		else {
			if (user[0][0]) {
				user[0] = user[0][0];
				if (user[0].password){
					if (bcrypt.comparePassword(password, user[0].password)) {
						if (user[0].state == 1)
							done(null, user[0]);
						else {
							errSignin = 'Tài khoản chưa được xác thực!';
							done(null, false);
						}
					} else {
						errSignin = 'Email hoặc mật khẩu không đúng';
						done(null, false);
					}
				} else {
					errSignin = 'Email đã được đăng ký ở tài khoản khác! Đăng nhập bằng Facebook hoặc Google';
					done(null, false);
				}
			} else {
				errSignin = 'Email hoặc mật khẩu không đúng';
				done(null, false);
			}
		}
	})
}))

passport.serializeUser(function(user, done) {
  done(null, user);
})
passport.deserializeUser(function(user, done) {
  done(null, user);
})

// Test and Repair

app.get('/test',function(req,res) {
    userMD.query(`select * from articles where kind = 1`, (err, result) => {
    	console.log(result.length);
    	res.send('Testing')
    })
});
app.get('/insertkind',function(req,res) {
	const kindName 	= ['Công nghệ', 'Bóng đá', 'Du lịch', 'Sức khoẻ'];
	const kindurl	= ['cong-nghe', 'bong-da', 'du-lich', 'suc-khoe'];
	for (let i = 0; i < 4; i++){
		userMD.query(`insert into kind (kindname, kindurl) values ('${kindName[i]}', '${kindurl[i]}')`, (err) => {
			
		})
	}
	res.send('Thành công')
});

/*app.get('/truyendulieu',function(req,res) {
    userMD.query(`select * from articles`, (err, all) => {
    	for (let i = 42; i < all.length; i++) {
    		db4freeMD.query(`insert into articles values (${all[i].id}, ${all[i].kind}, '${all[i].title}', '${all[i].titleurl}', '${all[i].imagelink}', '${all[i].content}', ${all[i].views}, NOW())`, err => {
		    	res.send('thành công');
		    });
    	}
    })
    
});*/

/*app.get('/xoadatabase',function(req,res) {
    userMD.query(`drop database enews`, err => {
    	res.send('Thành công');
    })
});*/

module.exports = app;

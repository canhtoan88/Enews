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
	notify		= null;

app.use(passport.initialize());
app.use(passport.session());

app.get('/',function(req,res) {
    const user = (req.isAuthenticated()) ? req.isAuthenticated() : null;

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
	if (!req.session.passport.user.phone) {
		res.send('Cần số điện thoại');
	} else {
		res.redirect('/index');
	}
});

app.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/dangnhap'}), (req,res) => {
    if (!req.session.passport.user.phone) {
		res.send('Cần số điện thoại');
	} else {
		res.redirect('/index');
	}
});

passport.use(new FacebookStrategy({
	clientID: '735019396847561',
	clientSecret: '2317cb5b3053e11e5634dee59d110007',
	callbackURL: 'https://localhost:3000/auth/facebook/callback',
	enableProof: true,
	profileFields: ['email', 'displayName'] // id, photos
}, (accessToken, refreshToken, profile, cb) => {
	const user = {
		fullname: profile.displayName,
		email: profile._json.email,
		state:true
	}
	userMD.findOrCreate({email: user.email}, user, function(err, result) {
		if (err) {
			console.log(err);
		} else {
			cb(null, result);
		}
	})
}))

passport.use(new GoogleStrategy({
	clientID: '946591989903-g8ljeh9j7vn795bt3f83hosv9iv75c2g.apps.googleusercontent.com',
	clientSecret: '-Xrl3AZCAC0VCWNggFQSryVc',
	callbackURL: 'https://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => {
	const user = {
		fullname: profile.name.familyName + ' ' + profile.name.givenName,
		email: profile.emails[0].value,
		state:true
	}
	userMD.findOrCreate({email: user.email}, user, function(err, result) {
		if (err) {console.log(err);}
		else {
			cb(null, result);
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
	userMD.query(`SELECT * FROM users WHERE email = '${user.email}'`, function(err, result) {
		if (err) {console.log(err);}
		else {
			if (result[0]) {
				errSignup = 'Email đã được đăng ký ở một tài khoản khác';
				res.redirect('/dangky');
			} else {
				userMD.query(`insert into users values ('${user.id}', '${user.email}', '${user.password}', '${user.fullname}', 0, 0, 0)`, function(err, result) {
					if (err) {console.log(err);}
					else {
						// Message and receiver
						/*const mailOption = {
							sender: 'Enews',
							to: user.email,
							subject: 'Xác thực tài khoản',
							template: 'mail-confirm',
							context: {
								url: 'https://localhost:3000/xacthuc-'+ user._id,
								name: user.fullname
							}
						}*/

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
			}
		}
	})
});

app.get('/xacthuc-:id', (req, res) => {
	userMD.query(`select * from users where id = '${req.params.id}'`, function(err, result) {
		if (result[0]) {
			if (result[0].state == 1) {
				res.json('Yêu cầu xác thực không thành công do tài khoản đã được xác thực từ trước!');
			} else {
				userMD.query(`update users set state = 1 where id = '${result[0].id}'`, (err) => {
				if (req.isAuthenticated())
					req.session.passport.user.state = true;
				res.json('Tài khoản của bạn đã được xác thực!');
			})
			}
		} else {
			res.json('Tài khoản cần xác thực không được tìm thấy!');
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
	userMD.query(`select * from users where email = '${email}'`, function(err, user) {
		if (err) {
			console.log(err);
		} else {
			if (user[0]) {
				const mailOption = {
					sender: 'IShare',
					to: email,
					subject: 'Cấp lại mật khẩu',
					html: `<h3>Bạn quên mật khẩu?</h3>
						<p>Click vào <a href="${config.get('host')}/caplaimatkhau-${user[0].id}">đây</a> để lấy lại mật khẩu</p>`
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
app.get('/caplaimatkhau-:id', (req, res) => {
	res.render('renewpassword', {id: req.params.id});
});

// Re-password
app.post('/caplaimatkhau', (req, res) => {
  	const id 		= req.body.id,
		password 	= bcrypt.hashPassword(req.body.password);
	userMD.query(`update users set password = '${password}' where id = '${id}'`, function(err) {
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
			userMD.query(`select * from saved, articles where saved.id_user = '${req.user.id}' and saved.id_article = articles.id`, function(err, saved) {
				if (saved.length > 0)
					res.render('profile', {user: req.user, tab, saved});
				else
					res.render('profile', {user: req.user, tab, saved: null});
			})
		} else {
			res.redirect('/thongtintaikhoan-' + req.user.id);
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
	userMD.query(`update users set fullname = '${user.fullname}' where email = '${user.email}'`, user, function(err, result) {
		if (err) {
			console.log(err);
		} else {
			res.json('Cập nhập thông tin thành công');
		}
	})
});

app.post('/doimatkhau', (req, res) => {
	const email 	= req.body.email,
		password 	= req.body.password,
		newpassword = bcrypt.hashPassword(req.body.newpassword);
	// Find account want to change the their password
	userMD.query(`select password from users where email = '${email}'`, function(err, oldPassword) {
		if (err) {
			console.log(err);
		} else {
			// Compare new and old password
			if (bcrypt.comparePassword(password, oldPassword[0].password)) {
				userMD.query(`update users set password = '${newpassword}' where email = '${email}'`, function(err) {
					if (err) {
						console.log(err);
					} else {
						res.render('sitemove', {content: 'Thay đổi mật khẩu thành công!'})
					}
				})
			} else {
				res.json('Mật khẩu củ không chính xác');
			}
		}
	})
});

// Sign in with account from sign up
passport.use(new LocalStrategy((username, password, done) => {
	userMD.query(`select * from users where email = '${username}'`, function(err, user) {
		if (err) {console.log(err);}
		else {
			if (user[0]) {
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

module.exports = app;

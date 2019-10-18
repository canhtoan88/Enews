const express 			= require('express');
const app 				= express.Router();

const adminMD			= require('../models/user');

app.get('/',function(req,res) {
	req.session.admin = null;
    res.render('admin_login');
});

app.post('/', function(req,res) {
	adminMD.query(`select * from admin where username = '${req.body.username}' and password = '${req.body.password}'`, (err, admin) => {
		if (admin[0]){
			req.session.admin = true;
			res.redirect('dangbai');
		} else {
			res.redirect('admin');
		}
	})
});

module.exports = app;

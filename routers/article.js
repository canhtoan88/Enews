const express   = require('express');
const app       = express.Router();
const cookie    = require('cookie');

const moment    = require('moment');
moment.locale('vi');

const upload = require('../helper/uploadfile');
const slug = require('../helper/slug');
const requiresignin = require('../helper/requiresignin');

const articleMD = require('../models/user');

app.get('/*-:id',function(req,res) {
    const id = req.params.id;

    articleMD.query(`SELECT articles.id, kind, title, titleurl, imagelink, content, date, kindname, kindurl FROM articles, kind WHERE articles.id = ${id} AND kind.id = articles.kind`, function(err, article) {
        if (err) {console.log(err);}
        else {
            if (article[0]) {

                // Set views for current user
                if (req.isAuthenticated()) {
                    articleMD.query(`select count(*) as number from views where id_user = '${req.user.id}' and id_article = ${id}`, (err, result) => {
                        if (err)
                            console.log(err);
                        else {
                            if (result[0].number == 0) {
                                articleMD.query(`UPDATE users SET views = views + 1 WHERE id = '${req.user.id}'`, err => {
                                    if (err) 
                                        console.log(err);
                                })
                                articleMD.query(`insert into views values ('${req.user.id}', ${id})`, err => {
                                    if (err) 
                                        console.log(err);
                                })
                            }
                        }
                    })
                }

                // Save current article's id into cookie
                /*if (cookie.parse(req.headers.cookie).seenArticles) {
                    let strSeenArticles = cookie.parse(req.headers.cookie).seenArticles;
                    let arrSeenArticles = strSeenArticles.split('')
                    console.log(typeof arrSeenArticles);
                    arrSeenArticles.push(id);
                    res.setHeader('Set-Cookie', `seenArticles=${JSON.stringify(arrSeenArticles)}`)
                    console.log(cookie.parse(req.headers.cookie).seenArticles);
                } else {
                    res.setHeader('Set-Cookie', 'seenArticles=[]');
                }*/

                // Get similar articles
                articleMD.query(`SELECT id, kind, title, titleurl, imagelink, views, date FROM articles WHERE kind = ${article[0].kind} AND id <> ${id} ORDER BY date DESC LIMIT 10`, (err, similar) => {
                    if (similar.length > 0) {
                        req.session.url = req.originalUrl;

                        // Set view for this article
                        var myTimeout = setTimeout(() => {
                            articleMD.query(`update articles set views = views + 1 where id = ${id}`, err => {
                                if (err) {console.log(err);}
                            })
                        }, 0);

                        // Get comments
                        articleMD.query(`select comments.id as id_comment, id_user, content, date, users.id as id_users, fullname from comments, users where id_article = ${id} and id_user = users.id order by date desc`, (err, comments) => {
                            if (err) console.log(err);
                            else {
                                // Check comments
                                if (comments.length == 0) {
                                    comments = null;
                                }

                                // Get the most new articles
                                articleMD.query(`select * from articles where id <> ${id} order by date desc limit 6`, (err, newArticles) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        // Allow article if signed in
                                        if (req.isAuthenticated()) {
                                            articleMD.query(`select count(*) as number from saved where id_user = '${req.user.id}' and id_article = ${id}`, (err, result) => {
                                                res.render('reading', {article: article[0], newArticles, comments, moment, num: result[0].number, similar, user: req.user});
                                            })
                                        } else {
                                            res.render('reading', {article: article[0], newArticles, comments, moment, num: null, similar, user: null});
                                        }
                                    }
                                })
                            }
                        })
                    } else
                        res.render('reading', {article: article[0], moment, num: null, similar, user: null});
                })
            } else {
                res.status(404).send('Bài viết không được tìm thấy');
            }
        }
    })
});

app.get('/luubaiviet/:url/:id',function(req,res) {
    if (req.isAuthenticated()){
        articleMD.query(`insert into saved value ('${req.user.id}', ${req.params.id})`, (err, result) => {
            if (err) 
                console.log(err);
            else {
                res.redirect(`/baiviet/${req.params.url}-${req.params.id}`);
            }
        })
    } else {
        req.session.url = `/baiviet/${req.params.url}-${req.params.id}`;
        res.redirect('/dangnhap');
    }
});

app.get('/xoa/:id',function(req,res) {
    if (req.isAuthenticated()) {
        articleMD.query(`delete from saved where id_user = '${req.user.id}' and id_article = ${req.params.id}`, function(err) {
            if (err) {
                res.status(404).send('Bài viết không được tìm thấy!')
            } else {
                res.redirect(`/thongtintaikhoan-1-${req.user.id}`);
            }
        })
    } else {
        requiresignin(res);
    }
});

app.post('/binhluan/:id',function(req,res) {
    const id    = req.params.id,
        content = req.body.commentContent;
    articleMD.query(`insert into comments (id_user, id_article, content, date) values ('${req.user.id}', ${id}, '${content}', NOW())`, err => {
        if (err) console.log(err);
        else {
            articleMD.query(`update users set comment = comment + 1 where id = '${req.user.id}'`, err => {
                if (err) {console.log(err);}
                res.redirect(req.session.url + '#commentArea');
            })
        }
    })
});

/*
app.get('/chinhsua/:id',function(req,res) {
    if (req.isAuthenticated()) {
        articleMD.findById(req.params.id)
        .populate('department')
        .exec(function(err, article) {
            if (err) {console.log(err);}
            else {
                if (article) {
                    if (article.owner == req.session.passport.user._id) {
                        res.render('writting', {user: req.session.passport.user, kind: article.kind, article: article})
                    } else {
                        res.send('Bạn không có quyền chỉnh sửa bài viết này!')
                    }
                } else {
                    res.send('Bài viết không tồn tại!')
                }
            }
        }) 
    } else {
        requiresignin(res);
    }
});

app.post('/chinhsua/:id', function(req,res) {
    if (req.isAuthenticated()) {
        const article = {
            kind        : req.body.kind,
            booktitle   : req.body.booktitle,
            department  : req.body.department,
            specialized : req.body.specialized,
            price       : req.body.price,
            descript    : req.body.descript,
            titleurl    : slug(req.body.booktitle)
        }
        articleMD.findByIdAndUpdate(req.params.id, article, function(err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/baiviet/' + article.titleurl + '-' + req.params.id);
            }
        })
    } else {
        requiresignin(res);
    }
});
*/
module.exports = app;
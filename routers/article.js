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

    articleMD.query(`call FIND_ARTICLE_INFO_PROC(${id})`, function(err, article) {
        if (err) {console.log(err);}
        else {
            if (article[0][0]) {
                article[0] = article[0][0];
                // Set views for current user
                if (req.isAuthenticated()) {
                    articleMD.query(`select CHECK_VIEWS_ARTICLE_FN('${req.user.id}', ${id}) as seen`, (err, result) => {
                        if (err)
                            console.log(err);
                        else {
                            if (result[0].seen == 0) {
                                articleMD.query(`select INCREASE_VIEWS_CR_USER_FN('${req.user.id}')`, err => {
                                    if (err)
                                        console.log(err);
                                })
                                articleMD.query(`select SET_USER_VIEW_ARTICLE_FN('${req.user.id}', ${id})`, err => {
                                    if (err)
                                        console.log(err);
                                })
                            }
                        }
                        // Increase 1 view for current user
                        req.user.views += 1;
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
                articleMD.query(`call FIND_SIMILAR_ARTICLES_PROC(${id}, ${article[0].kind_id})`, (err, similar) => {
                    if (similar[0].length > 0) {
                        similar = similar[0];
                        req.session.url = req.originalUrl;

                        // Set view for this article
                        var myTimeout = setTimeout(() => {
                            articleMD.query(`select INCREASE_VIEWS_ARTICLE_FN(${id})`, err => {
                                if (err) {console.log(err);}
                            })
                        }, 0);

                        // Get comments
                        articleMD.query(`call FIND_COMMENTS_PROC(${id})`, (err, comments) => {
                            if (err) console.log(err);
                            else {
                                // Check comments
                                if (comments[0].length == 0) {
                                    comments = null;
                                } else comments = comments[0];

                                // Get the most new articles
                                articleMD.query(`call FIND_6_OTHER_LASTEST_ARTICLES_PROC(${id})`, (err, newArticles) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        newArticles = newArticles[0];
                                        // Check current user have been saved article
                                        if (req.isAuthenticated()) {
                                            articleMD.query(`call CHECK_SAVED_ARTICLE_PROC('${req.user.id}', '${id}')`, (err, count) => {
                                                res.render('reading', {article: article[0], newArticles, comments, moment, num: count[0][0].quantity, similar, user: req.user});
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

app.get('/save',function(req,res) {
    if (req.isAuthenticated()){
        articleMD.query(`select SAVE_ARTICLE_FN('${req.user.id}', ${req.query.id})`, (err, result) => {
            if (err)
                console.log(err);
            else {
                //res.redirect(`/baiviet/${req.params.url}-${req.params.id}`);
                res.status(200).json(result);
            }
        })
    } else {
        //req.session.url = `/baiviet/${req.params.url}-${req.params.id}`;
        //res.redirect('/dangnhap');
        res.status(403).json('Chưa đăng nhập!');
    }
});

app.get('/unsave',function(req,res) {
    if (req.isAuthenticated()) {
        articleMD.query(`select UNSAVE_ARTICLE_FN('${req.user.id}', ${req.query.id})`, function(err, result) {
            if (err) {
                res.status(404).send('Bài viết không được tìm thấy!')
            } else {
                //res.redirect(`/thongtintaikhoan-1-${req.user.id}`);
                res.status(200).json(result);
            }
        })
    } else {
        res.status(403).json('Chưa đăng nhập!');
    }
});

app.post('/binhluan',function(req,res) {
    const id    = req.query.id,
        content = req.body.commentContent;
    articleMD.query(`select INSERT_INFO_COMMENT_FN('${req.user.id}', ${id}, '${content}')`, err => {
        if (err) console.log(err);
        else {
            // Update quantity comment of current user
            articleMD.query(`select INCREASE_COMMENTS_CR_USER_FN('${req.user.id}')`, err => {
                if (err) {console.log(err)}
                req.user.comment += 1;
                // Query the comment just is posted
                articleMD.query(`call FIND_COMMENT_JUST_IS_POSTED_PROC('${req.user.id}')`, (err, comment) => {
                    //console.log(comment);
                    res.status(200).json(comment[0][0]);
                    //res.redirect(req.session.url + '#commentArea');
                })
            })
        }
    })
});

// Edit comment
app.put('/editComment', (req, res) => {
    if (req.isAuthenticated()) {
        const id = req.query.id;
        const editedContent = req.body.editedContent;
        articleMD.query(`select UPDATE_INFO_COMMENT_FN('${editedContent}', ${id})`, (err, result) => {
            if (err) {
                console.log(err);
            }
            res.status(200).json(result);
        })
    } else {
        res.status(403).json('Chưa đăng nhập!');
    }
});

app.delete('/deleteComment', (req, res) => {
    if (req.isAuthenticated()) {
        const id = req.query.id;
        articleMD.query(`select DELETE_COMMENT_FN(${id})`, (err, result) => {
            if (err) {
                console.log(err);
            }
            res.status(200).json(result);
        })
    } else {
        //res.redirect('/'+req.session.url);
        res.status(403).json('Chưa đăng nhập!');
    }
})

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

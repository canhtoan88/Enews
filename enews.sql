CREATE DATABASE enews;

USE enews;

-- Admin
CREATE TABLE admin (
	id int primary key auto_increment,
    fullname varchar(100),
    phone char(10),
    username varchar(6),
    email varchar(64),
    password varchar(32)
);

-- User's info table
CREATE TABLE users (
    id char(10) PRIMARY KEY not null,
    email varchar(32) not null,
    password varchar(64),
    fullname varchar(64) not null,
    views int,
    comment int,
    state BINARY DEFAULT 0,
    created datetime default NOW()
);

alter table users modify email varchar(32) not null unique;

-- Kind of artilces
CREATE TABLE kind (
    id int PRIMARY KEY AUTO_INCREMENT,
    kindname varchar(32) not null,
    kindurl varchar(20) not null
);

-- Articles's info table
CREATE TABLE articles (
    id int PRIMARY KEY AUTO_INCREMENT,
    kind_id int not null,
    title varchar(200) not null,
    titleurl varchar(200) not null,
    imagelink varchar(150) not null,
    content text not null,
    views int,
    date datetime DEFAULT NOW(),
    creater int
);
ALTER TABLE articles ADD FOREIGN KEY (kind_id) REFERENCES kind (id)
ON UPDATE CASCADE
ON DELETE SET NULL;
ALTER TABLE articles ADD FOREIGN KEY (creater) REFERENCES admin (id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- View: Total articles forllow category for adminitrator
CREATE VIEW totalArticlesFollowCategory AS
SELECT COUNT(*) AS sumArticles FROM articles GROUP BY kind_id ORDER BY kind_id;

-- View: Total articles for adminitrator
CREATE VIEW totalArticles AS
SELECT COUNT(*) AS sumArticles FROM articles;
-- View: New articles for adminitrator
CREATE VIEW newArticles AS
SELECT count(*) AS sum FROM articles
WHERE date > (date_add(curdate(), INTERVAL '-7' DAY));

-- View: Total accounts for adminitrator
CREATE VIEW totalAccounts AS
SELECT COUNT(*) AS sumUsers FROM users;
-- View: New accounts for adminitrator
CREATE VIEW newAccounts AS
SELECT count(*) AS sum FROM users
WHERE created > (date_add(curdate(), INTERVAL '-7' DAY));

-- View: Total comments for adminitrator
CREATE VIEW totalComments AS
SELECT COUNT(*) AS sumComments FROM comments;
-- View: New comments for adminitrator
CREATE VIEW newcomments AS
SELECT count(*) AS sum FROM comments
WHERE date > (date_add(curdate(), INTERVAL '-7' DAY));

-- View: Total views for adminitrator
CREATE VIEW totalViews AS
SELECT COUNT(*) AS sumViews FROM views;
-- View: New views for adminitrator
CREATE VIEW newViews AS
SELECT count(*) AS sum FROM views
WHERE date > (date_add(curdate(), INTERVAL '-7' DAY));

-- Views of artilces
CREATE TABLE views (
    user_id char(10) not null,
    article_id int not null,
    date datetime DEFAULT NOW()
);
ALTER TABLE views ADD FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE views ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE SET NULL;

-- Comments of articles
CREATE TABLE comments (
    id int PRIMARY KEY AUTO_INCREMENT,
    user_id CHARACTER(10) not null,
    article_id int not null,
    content varchar(300) not null,
    edited binary default 0,
    date datetime DEFAULT NOW()
);
ALTER TABLE comments ADD FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE;
ALTER TABLE comments ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE CASCADE;

-- Articles is saved
CREATE TABLE saved (
    user_id CHARACTER(10) not null,
    article_id int not null
);
ALTER TABLE saved ADD FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE;
ALTER TABLE saved ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE CASCADE;

CREATE TABLE notifies (
	id int primary key auto_increment,
    content varchar(500) not null,
    state boolean default 0,
    admin_id int not null,
    created datetime default NOW()
);
ALTER TABLE notifies ADD FOREIGN KEY (admin_id) REFERENCES admin (id)
ON DELETE CASCADE;


-- Trigger: for Insert Admin account and Delete Article
-- Insert Admin account
DELIMITER //
CREATE TRIGGER BEFORE_INSERT_ADMIN_TG
BEFORE INSERT ON admin
FOR EACH ROW
BEGIN
	declare sum int;
	select count(*) into sum
    from admin 
    where phone = NEW.phone 
    or email = NEW.email 
    or username = NEW.username;
    if sum > 0 then
		SIGNAL sqlstate '45001' set message_text = "Một vài thông tin đã tồn tại!";
	end if;
END //
DELIMITER ;

-- Delete Article
DELIMITER //
CREATE TRIGGER BEFORE_DELETE_ARTICLE_PASSWORD_TG
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
	declare sum int;
	select count(*) into sum
    from oldpassword 
    where user_id = NEW.id
    and old_password = NEW.password;
    if sum = 0 then
		insert into oldpassword (user_id, old_password) values (NEW.id, NEW.password);
        
	end if;
END //
DELIMITER ;

-- Procedure: 
-- Find new articles follow category
DELIMITER //
CREATE PROCEDURE FIND_ARTICLES_FOLLOW_CATEGORY_PROC(IN id int)
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
	from articles, kind 
	where articles.kind_id = kind.id 
	and kind_id = id
	order by date desc
	limit 4;
END //
DELIMITER ;

-- Find lastest articles
DELIMITER //
CREATE PROCEDURE FIND_LASTEST_ARTICLES_PROC()
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
	from articles, kind 
	where articles.kind_id = kind.id
	order by date desc
	limit 26;
END //
DELIMITER ;

-- Get articles that have a lot of interest in the last 30 days
DELIMITER //
CREATE PROCEDURE FIND_INTERESTED_ARTICLES_PROC(IN lim int)
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
    from articles, kind 
    where articles.kind_id = kind.id 
    and date > (SELECT DATE_ADD(CURDATE(), INTERVAL '-30' DAY)) 
    order by views desc 
    limit lim;
END //
DELIMITER ;

-- Select User from email
DELIMITER //
CREATE PROCEDURE FIND_USER_BY_EMAIL_PROC
(IN email varchar(32))
BEGIN
	SELECT * FROM users WHERE users.email = email;
END //
DELIMITER ;

-- Select all user
DELIMITER //
CREATE PROCEDURE FIND_ALL_USERS_PROC()
BEGIN
	SELECT * FROM users ORDER BY created;
END //
DELIMITER ;

-- Select a Admin account
DELIMITER //
CREATE PROCEDURE FIND_ADMIN_BY_USERNAME_PROC
(IN us varchar(6))
BEGIN
	select id, fullname, username, phone, email from admin where username = us;
END //
DELIMITER ;

-- Select Admin account
DELIMITER //
CREATE PROCEDURE FIND_ADMIN_PROC
(IN us varchar(6), IN pw varchar(32))
BEGIN
	select * from admin where username = us and password = pw;
END //
DELIMITER ;

-- Select Admin account
DELIMITER //
CREATE PROCEDURE FIND_ADMIN_BY_ID_PROC
(IN id int)
BEGIN
	select * from admin where admin.id = id;
END //
DELIMITER ;

-- Select all admins
DELIMITER //
CREATE PROCEDURE FIND_ADMINS_PROC(IN us varchar(6))
BEGIN
	select id, fullname, phone, username, email from admin where username <> us;
END //
DELIMITER ;

-- Select Saved
-- Select User from email
DELIMITER //
CREATE PROCEDURE FIND_SAVED_PROC
(IN id char(10))
BEGIN
	select * from saved, articles where saved.user_id = id and saved.article_id = articles.id;
END //
DELIMITER ;

-- Select Article info
DELIMITER //
CREATE PROCEDURE FIND_ARTICLE_INFO_PROC
(IN article_id int)
BEGIN
	SELECT articles.id, kind_id, title, titleurl, imagelink, content, creater, date, kindname, kindurl 
	FROM articles, kind
	WHERE articles.id = article_id
	AND kind.id = articles.kind_id;
END //
DELIMITER ;

-- Select all articles
DELIMITER //
CREATE PROCEDURE FIND_ALL_ARTICLES_PROC()
BEGIN
	SELECT articles.id, articles.kind_id, title, views, date, kindname, creater
	FROM articles, kind
	WHERE kind.id = articles.kind_id
    ORDER BY date;
END //
DELIMITER ;

-- Select all articles
DELIMITER //
CREATE PROCEDURE FIND_ALL_ARTICLES_FOLLOW_CATEGORY_PROC(IN kind int)
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
	from articles, kind 
	where articles.kind_id = kind.id 
	and kind_id = kind 
	order by date desc;
END //
DELIMITER ;

-- Select articles
DELIMITER //
CREATE PROCEDURE SEARCH_ARTICLES_PROC(IN strSearch text)
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
	from articles, kind 
	where title like strSearch 
	and articles.kind_id = kind.id
    order by date desc;
END //
DELIMITER ;

-- Search articles by content
DELIMITER //
CREATE PROCEDURE SEARCH_ARTICLES_BY_CONTENT_PROC(IN strSearch text)
BEGIN
	select articles.id, kind_id, title, titleurl, imagelink, content, date, views, kindname, kindurl 
	from articles, kind 
	where content like strSearch 
	and articles.kind_id = kind.id
    order by date desc;
END //
DELIMITER ;

-- Get similar articles
DELIMITER //
CREATE PROCEDURE FIND_SIMILAR_ARTICLES_PROC
(IN article_id int, IN kind_id int)
BEGIN
	SELECT id, kind_id, title, titleurl, imagelink, views, date 
	FROM articles 
	WHERE articles.kind_id = kind_id 
	AND id <> article_id 
	ORDER BY date DESC 
	LIMIT 10;
END //
DELIMITER ;

-- Select comments of article
DELIMITER //
CREATE PROCEDURE FIND_COMMENTS_PROC
(IN article_id int)
BEGIN
	select comments.id as comment_id, edited, user_id, content, date, fullname 
	from comments, users 
	where comments.article_id = article_id 
	and users.id = user_id 
	order by date;
END //
DELIMITER ;

-- Select all comments
DELIMITER //
CREATE PROCEDURE FIND_ALL_COMMENTS_PROC()
BEGIN
	select * from comments order by date desc;
END //
DELIMITER ;

-- Select the lastest articles
DELIMITER //
CREATE PROCEDURE FIND_6_OTHER_LASTEST_ARTICLES_PROC
(IN article_id int)
BEGIN
	select * from articles where id <> article_id order by date desc limit 6;
END //
DELIMITER ;

-- Check saved article
DELIMITER //
CREATE PROCEDURE CHECK_SAVED_ARTICLE_PROC
(IN user_id char(10), IN article_id int)
BEGIN
	select count(*) as quantity 
    from saved 
    where saved.user_id = user_id 
    and saved.article_id = article_id;
END //
DELIMITER ;

-- Check saved article
DELIMITER //
CREATE PROCEDURE FIND_TOTAL_ARTICLES_PROC
(IN kind_id int)
BEGIN
	select count(*) as total from articles where articles.kind_id = kind_id;
END //
DELIMITER ;

-- Select the comment just is posted
DELIMITER //
CREATE PROCEDURE FIND_COMMENT_JUST_IS_POSTED_PROC
(IN user_id char(10))
BEGIN
	select comments.id, content, fullname, date 
	from comments, users 
	where comments.user_id = user_id 
	and users.id = comments.user_id
	order by date desc 
	limit 1;
END //
DELIMITER ;

-- Select the old password
DELIMITER //
CREATE PROCEDURE FIND_OLD_PASSWORD_PROC
(IN email varchar(32))
BEGIN
	select password from users where users.email = email;
END //
DELIMITER ;

-- Select users viewed articles
DELIMITER //
CREATE PROCEDURE FIND_ALL_VIEWS_ARTICLES_PROC()
BEGIN
	select users.id, fullname, title, views.date 
    from users, articles, views 
    where users.id = views.user_id
    and articles.id = views.article_id
    order by views.date desc;
END //
DELIMITER ;
call FIND_ALL_NOTIFYCATIONS_PROC(1);
drop PROCEDURE FIND_ALL_NOTIFYCATIONS_PROC;
-- Select users viewed articles
DELIMITER //
CREATE PROCEDURE FIND_ALL_NOTIFYCATIONS_PROC(IN id int)
BEGIN
	select * from notifies
    where admin_id = id
    order by state;
END //
DELIMITER ;

-- Select users viewed articles
DELIMITER //
CREATE PROCEDURE FIND_USER_VIEW_MANY_ARTICLES_PROC()
BEGIN
	select users.id, users.fullname, count(*) as sum
    from users, articles, views 
    where users.id = views.user_id
    and articles.id = views.article_id
    and views.date > (date_add(curdate(), INTERVAL '-7' DAY))
    group by views.user_id
    order by sum desc
    limit 5;
END //
DELIMITER ;

drop procedure COUNT_NOTIFY_DONT_READ_YET_PROC;
-- Count notification don't read yet

DELIMITER //
CREATE PROCEDURE COUNT_NOTIFY_DONT_READ_YET_PROC
(IN id int)
BEGIN
	select count(*) as total
    from notifies 
    where notifies.admin_id = id
    and state = 0;
END //
DELIMITER ;


-- Function: insert and update user, insert Article
-- Insert User account Functio
DELIMITER //
CREATE FUNCTION INSERT_USER_FN 
(id char(10), email varchar(32), password varchar(64), fullname varchar(64))
RETURNS binary DETERMINISTIC
BEGIN
	INSERT INTO users VALUES (id, email, password, fullname, 0, 0, 0, NOW());
	RETURN true;
END //
DELIMITER ;

-- Delete account
DELIMITER //
CREATE FUNCTION DELETE_USER_FN 
(id char(10))
RETURNS binary DETERMINISTIC
BEGIN
	delete from users where users.id = id;
	RETURN true;
END //
DELIMITER ;

-- Verify User account
DELIMITER //
CREATE FUNCTION VERIFY_USER_FN 
(id char(10))
RETURNS binary DETERMINISTIC
BEGIN
	update users set state = 1 where id = id;
	RETURN true;
END //
DELIMITER ;

-- Insert Article Function
DELIMITER //
CREATE FUNCTION INSERT_ARTICLE_FN 
(kind_id int, title varchar(200), titleurl varchar(100), imagelink varchar(100), content text, creater int)
RETURNS binary DETERMINISTIC
BEGIN
	INSERT INTO articles (kind_id, title, titleurl, imagelink, content, views, creater, date) 
    VALUES (kind_id, title, titleurl, imagelink, content, 0, creater, NOW());
	RETURN true;
END //
DELIMITER ;

-- Delete Article Function
DELIMITER //
CREATE FUNCTION DELETE_ARTICLE_FN(id int)
RETURNS binary DETERMINISTIC
BEGIN
	delete from articles where articles.id = id;
	RETURN true;
END //
DELIMITER ;

select UPDATE_ARTICLE_FN(47, 'com', 'me');

-- Delete Article Function
DELIMITER //
CREATE FUNCTION UPDATE_ARTICLE_FN(id int, title varchar(200), content text)
RETURNS binary DETERMINISTIC
BEGIN
	update articles set articles.title = title, articles.content = content where articles.id = id;
	RETURN true;
END //
DELIMITER ;

-- Save Article Function
DELIMITER //
CREATE FUNCTION SAVE_ARTICLE_FN 
(user_id char(10), article_id int)
RETURNS binary DETERMINISTIC
BEGIN
	insert into saved value (user_id, article_id);
	RETURN true;
END //
DELIMITER ;
-- Unsave Article Function
DELIMITER //
CREATE FUNCTION UNSAVE_ARTICLE_FN 
(user_id char(10), article_id int)
RETURNS binary DETERMINISTIC
BEGIN
	delete from saved where saved.user_id = user_id and saved.article_id = article_id;
	RETURN true;
END //
DELIMITER ;

-- Check views from current user for article
DELIMITER //
CREATE FUNCTION CHECK_VIEWS_ARTICLE_FN
(user_id char(10), article_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	declare quantity int;
	select count(*) into quantity 
    from views 
    where views.user_id = user_id 
    and views.article_id = article_id;
    IF quantity = 0
		then RETURN 0;
		ELSE RETURN 1;
    END IF;
END //
DELIMITER ;

-- Check views from current user for article
DELIMITER //
CREATE FUNCTION CHECK_VIEWS_ARTICLE_FN
(user_id char(10), article_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	declare quantity int;
	select count(*) into quantity 
    from views 
    where views.user_id = user_id 
    and views.article_id = article_id;
    IF quantity = 0
		then RETURN 0;
		ELSE RETURN 1;
    END IF;
END //
DELIMITER ;

-- Increment views for current user
DELIMITER //
CREATE FUNCTION INCREASE_VIEWS_CR_USER_FN
(user_id char(10))
RETURNS boolean DETERMINISTIC
BEGIN
	UPDATE users SET views = views + 1 WHERE id = user_id;
    RETURN true;
END //
DELIMITER ;

-- Set reader for article into views table
DELIMITER //
CREATE FUNCTION SET_USER_VIEW_ARTICLE_FN -- INCREASE_VIEWS_ARTICLE_FN
(user_id char(10), article_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	insert into views (user_id, article_id) values (user_id, article_id);
    RETURN true;
END //
DELIMITER ;

-- Increment views for article
DELIMITER //
CREATE FUNCTION INCREASE_VIEWS_ARTICLE_FN
(article_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	update articles set views = views + 1 where id = article_id;
    RETURN true;
END //
DELIMITER ;

-- Insert info's comment
DELIMITER //
CREATE FUNCTION INSERT_INFO_COMMENT_FN
(user_id char(10), article_id int, content text)
RETURNS boolean DETERMINISTIC
BEGIN
	insert into comments (user_id, article_id, content, date) 
    values (user_id, article_id, content, NOW());
    RETURN true;
END //
DELIMITER ;

-- Increase comments of current user
DELIMITER //
CREATE FUNCTION INCREASE_COMMENTS_CR_USER_FN
(user_id char(10))
RETURNS boolean DETERMINISTIC
BEGIN
	update users set comment = comment + 1 where id = user_id;
	RETURN true;
END //
DELIMITER ;

-- Update info's comment
DELIMITER //
CREATE FUNCTION UPDATE_INFO_COMMENT_FN
(editedContent varchar(300), comment_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	update comments set content = editedContent, edited = 1, date = NOW() where id = comment_id;
    RETURN true;
END //
DELIMITER ;

-- Delete comment
DELIMITER //
CREATE FUNCTION DELETE_COMMENT_FN
(comment_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	delete from comments where id = comment_id;
    RETURN true;
END //
DELIMITER ;

-- Update info's user
DELIMITER //
CREATE FUNCTION UPDATE_INFO_USER_FN
(named varchar(64), email varchar(32))
RETURNS boolean DETERMINISTIC
BEGIN
	update users set fullname = named where users.email = email;
    RETURN true;
END //
DELIMITER ;

-- Update new password
DELIMITER //
CREATE FUNCTION UPDATE_PASSWORD_USER_FN
(newPassword varchar(64), email varchar(32))
RETURNS boolean DETERMINISTIC
BEGIN
	update users set password = newPassword where users.email = email;
    RETURN true;
END //
DELIMITER ;

-- Add Admin account
DELIMITER //
CREATE FUNCTION ADD_ADMIN_ACCOUNT_FN
(fullname varchar(100), phone char(10), username varchar(6), email varchar(32), password varchar(64))
RETURNS boolean DETERMINISTIC
BEGIN
	INSERT INTO admin (fullname, phone, username, email, password) 
    values (fullname, phone, username, email, password);
    RETURN true;
END //
DELIMITER ;

-- Remove Admin account
DELIMITER //
CREATE FUNCTION REMOVE_ADMIN_FN(id int)
RETURNS boolean DETERMINISTIC
BEGIN
	DELETE FROM admin WHERE admin.id = id;
    RETURN true;
END //
DELIMITER ;

-- Add notification
DELIMITER //
CREATE FUNCTION ADD_NOTIFY_FN
(content varchar(500), admin_id int)
RETURNS boolean DETERMINISTIC
BEGIN
	INSERT INTO notifies (content, admin_id) 
    VALUES (content, admin_id);
    RETURN true;
END //
DELIMITER ;

-- Read notification
DELIMITER //
CREATE FUNCTION READ_NOTIFY_FN
(id int)
RETURNS boolean DETERMINISTIC
BEGIN
	UPDATE notifies SET state = 1 WHERE notifies.id = id;
    RETURN true;
END //
DELIMITER ;

-- Read all notification
DELIMITER //
CREATE FUNCTION READ_ALL_NOTIFIES_FN(id int)
RETURNS boolean DETERMINISTIC
BEGIN
	UPDATE notifies SET state = 1 WHERE admin_id = id;
    RETURN true;
END //
DELIMITER ;

-- Read all notification
DELIMITER //
CREATE FUNCTION DELETE_ALL_NOTIFIES_FN(id int)
RETURNS boolean DETERMINISTIC
BEGIN
	DELETE FROM notifies WHERE admin_id = id;
    RETURN true;
END //
DELIMITER ;

-- Create login user to authenticate database
DELIMITER //
CREATE FUNCTION CREATE_LOGIN_USER_FN
(username char(6))
RETURNS boolean DETERMINISTIC
BEGIN
	create user username@'localhost' identified by 'Canhtoan88';
    grant select on enews.* to username@'localhost';
    grant delete on enews.users to username@'localhost';
    grant insert, update, delete on enews.articles to username@'localhost';
    grant delete on enews.comments to username@'localhost';
    grant select on enews.views to username@'localhost';
    RETURN true;
END //
DELIMITER ;

-- Insert 4 kind
INSERT INTO kind (kindname, kindurl) VALUES ('Công nghệ', 'cong-nghe');
INSERT INTO kind (kindname, kindurl) VALUES ('Bóng đá', 'bong-da');
INSERT INTO kind (kindname, kindurl) VALUES ('Du lịch', 'du-lich');
INSERT INTO kind (kindname, kindurl) VALUES ('Sức khoẻ', 'suc-khoe');

ALTER USER 'canhtoan88'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Canhtoan88';
grant select, execute on enews.* to 'canhtoan88'@'localhost';
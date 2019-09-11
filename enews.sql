CREATE DATABASE enews;

USE enews;

-- Admin
CREATE TABLE admin (
    username char(5),
    password char(3)
);
INSERT INTO admin values ('admin', '123');

-- User's info table
CREATE TABLE users (
    id char(10) PRIMARY KEY,
    email varchar(32),
    password varchar(64),
    fullname varchar(64),
    views int,
    comment int,
    state BINARY DEFAULT 0
);

-- Kind of artilces
CREATE TABLE kind (
    id int PRIMARY KEY AUTO_INCREMENT,
    kindname varchar(32),
    kindurl varchar(20)
);

-- Articles's info table
CREATE TABLE articles (
    id int PRIMARY KEY AUTO_INCREMENT,
    kind_id int,
    title varchar(200),
    titleurl varchar(100),
    imagelink varchar(100),
    content text,
    views int,
    date datetime DEFAULT NOW()
);
ALTER TABLE articles ADD FOREIGN KEY (kind_id) REFERENCES kind (id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- View: Total articles for adminitrator
CREATE VIEW totalArticles AS
SELECT COUNT(*) AS sum FROM articles GROUP BY kind_id ORDER BY kind_id;

-- Views of artilces
CREATE TABLE views (
    user_id CHARACTER(10),
    article_id int,
    date datetime DEFAULT NOW()
);

ALTER TABLE views ADD FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE views ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE SET NULL;

-- Comments of articles
CREATE TABLE comments (
    id int PRIMARY KEY AUTO_INCREMENT,
    user_id CHARACTER(10),
    article_id int,
    content varchar(300),
    date datetime DEFAULT NOW()
);
ALTER TABLE comments ADD FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE;
ALTER TABLE comments ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE CASCADE;

-- Articles is saved
CREATE TABLE saved (
    user_id CHARACTER(10),
    article_id int
);

ALTER TABLE saved ADD FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE;
ALTER TABLE saved ADD FOREIGN KEY (article_id) REFERENCES articles (id)
ON DELETE CASCADE;

-- Insert 4 kind
INSERT INTO kind (kindname, kindurl) VALUES ('Công nghệ', 'cong-nghe');
INSERT INTO kind (kindname, kindurl) VALUES ('Bóng đá', 'bong-da');
INSERT INTO kind (kindname, kindurl) VALUES ('Du lịch', 'du-lich');
INSERT INTO kind (kindname, kindurl) VALUES ('Sức khoẻ', 'suc-khoe');
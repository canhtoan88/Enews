CREATE DATABASE enews;

USE enews;

CREATE TABLE admin (
    username char(5),
    password char(3)
);
INSERT INTO admin values ('admin', '123');

CREATE TABLE users (
    id char(10) PRIMARY KEY,
    email varchar(32),
    password varchar(64),
    fullname varchar(64),
    views int,
    comment int,
    state BINARY DEFAULT 0
);

CREATE TABLE kind (
    id int PRIMARY KEY AUTO_INCREMENT,
    kindname varchar(32),
    kindurl varchar(20)
);

CREATE TABLE articles (
    id int PRIMARY KEY AUTO_INCREMENT,
    kind int,
    title varchar(200),
    titleurl varchar(100),
    imagelink varchar(32),
    content text,
    views int,
    date datetime
);
ALTER TABLE articles ADD FOREIGN KEY (kind) REFERENCES kind (id);

CREATE TABLE views (
    id_user CHARACTER(10),
    id_article int
);

ALTER TABLE views ADD FOREIGN KEY (id_user) REFERENCES users (id);
ALTER TABLE views ADD FOREIGN KEY (id_article) REFERENCES articles (id);

CREATE TABLE comments (
    id int PRIMARY KEY AUTO_INCREMENT,
    id_user CHARACTER(10),
    id_article int,
    content varchar(300),
    date datetime
);

ALTER TABLE comments ADD FOREIGN KEY (id_user) REFERENCES users (id);
ALTER TABLE comments ADD FOREIGN KEY (id_article) REFERENCES articles (id);

CREATE TABLE saved (
    id_user CHARACTER(10),
    id_article int
);

ALTER TABLE saved ADD FOREIGN KEY (id_user) REFERENCES users (id);
ALTER TABLE saved ADD FOREIGN KEY (id_article) REFERENCES articles (id);
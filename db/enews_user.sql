-- MySQL dump 10.13  Distrib 8.0.17, for Win64 (x86_64)
--
-- Host: localhost    Database: enews
-- ------------------------------------------------------
-- Server version	8.0.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(10) NOT NULL,
  `email` varchar(32) NOT NULL,
  `password` varchar(64) DEFAULT NULL,
  `fullname` varchar(64) DEFAULT NULL,
  `views` int(11) DEFAULT NULL,
  `comment` int(11) DEFAULT NULL,
  `state` binary(1) DEFAULT '0',
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('al1ivvjl3l','nctt97@gmail.com','$2b$10$0PnfOGw3Gf8MJM7sd8JIe.0nrkBNjdkkRYwwZ7OUT1B1deUU1fisW','Cao Trung Thành',2,0,_binary '1','2019-10-20 11:56:48'),('txj194290w','nctt99@gmail.com','$2b$10$Jv788XffMiaStz3SY.02kOmn1u1Zn1E9yahTO3ItcopVxDbcXf3HS','Hồ Hùng Mạnh',3,1,_binary '1','2019-10-20 12:00:37'),('vei77d6tct','nctt98@gmail.com','$2b$10$1rj1RFLBpOW/IsiaHUOy.eG.7M0AxN/LhuAbO2mhD3LS60pg4u/jy','Ngô Hồng Thanh',2,0,_binary '1','2019-10-20 12:00:06'),('vmkpdnbafs','nctt96@gmail.com','$2a$10$1xYXUiNpindMwNcGiA8kvekLlVrz5ihdjUzs.olXF9VhF.vImzgxe','Cảnh Toàn',22,22,_binary '1','2019-10-19 14:15:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-10-30  7:45:00

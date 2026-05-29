CREATE DATABASE IF NOT EXISTS MTG_DECK_COMPANION;
USE MTG_DECK_COMPANION;

DROP TABLE IF EXISTS `deck_cards`;
DROP TABLE IF EXISTS `decks`;
DROP TABLE IF EXISTS `cards`;
DROP TABLE IF EXISTS `test_connection`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cards` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mana_cost` varchar(100) DEFAULT NULL,
  `type_line` varchar(255) DEFAULT NULL,
  `image_url` text,
  `source` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `decks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `commander_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commander_card_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `decks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `deck_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deck_id` int NOT NULL,
  `card_id` varchar(255) NOT NULL,
  `quantity` int DEFAULT '1',
  `section` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deck_id` (`deck_id`),
  KEY `card_id` (`card_id`),
  CONSTRAINT `deck_cards_ibfk_1` FOREIGN KEY (`deck_id`) REFERENCES `decks` (`id`),
  CONSTRAINT `deck_cards_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `test_connection` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema teamwork
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema teamwork
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `teamwork` DEFAULT CHARACTER SET utf8 ;
USE `teamwork` ;

-- -----------------------------------------------------
-- Table `teamwork`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `teamwork`.`users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(45) NOT NULL,
  `lastName` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `password` VARCHAR(9) NOT NULL,
  `gender` CHAR(1) NOT NULL,
  `jobRole` VARCHAR(45) NULL,
  `userImage` VARCHAR(100) NULL,
  `dept` VARCHAR(45) NULL,
  `address` VARCHAR(200) NULL,
  `createdOn` DATETIME NULL DEFAULT now(),
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `teamwork`.`gifs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `teamwork`.`gifs` (
  `gif_id` INT NOT NULL AUTO_INCREMENT,
  `imageUrl` VARCHAR(45) NOT NULL,
  `title` VARCHAR(45) NOT NULL,
  `dateCreated` DATETIME NULL DEFAULT now(),
  `users_user_id` INT NOT NULL,
  PRIMARY KEY (`gif_id`, `users_user_id`),
  INDEX `fk_gifs_users_idx` (`users_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_gifs_users`
    FOREIGN KEY (`users_user_id`)
    REFERENCES `teamwork`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `teamwork`.`article`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `teamwork`.`article` (
  `article_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  `article` VARCHAR(400) NULL,
  `dateCreated` DATETIME NOT NULL DEFAULT now(),
  `completed` CHAR(1) DEFAULT 'f',
  `users_user_id` INT NOT NULL,
  PRIMARY KEY (`article_id`, `title`, `users_user_id`),
  INDEX `fk_article_users1_idx` (`users_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_article_users1`
    FOREIGN KEY (`users_user_id`)
    REFERENCES `teamwork`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `teamwork`.`article_comment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `teamwork`.`article_comment` (
  `comment_id` INT NOT NULL AUTO_INCREMENT,
  `comment` VARCHAR(400) NOT NULL,
  `article_article_id` INT NOT NULL,
  `users_user_id` INT NOT NULL,
  `createdOn` DATETIME NULL DEFAULT now(),
  PRIMARY KEY (`comment_id`, `article_article_id`, `users_user_id`),
  INDEX `fk_article_comment_article1_idx` (`article_article_id` ASC) VISIBLE,
  INDEX `fk_article_comment_users1_idx` (`users_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_article_comment_article1`
    FOREIGN KEY (`article_article_id`)
    REFERENCES `teamwork`.`article` (`article_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_article_comment_users1`
    FOREIGN KEY (`users_user_id`)
    REFERENCES `teamwork`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `teamwork`.`gif_comment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `teamwork`.`gif_comment` (
  `gif_comment_id` INT NOT NULL AUTO_INCREMENT,
  `comment` VARCHAR(400) NOT NULL,
  `createdOn` DATETIME NULL DEFAULT now(),
  `gifs_gif_id` INT NOT NULL,
  `users_user_id` INT NOT NULL,
  PRIMARY KEY (`gif_comment_id`, `gifs_gif_id`, `users_user_id`),
  INDEX `fk_gif_comment_gifs1_idx` (`gifs_gif_id` ASC) VISIBLE,
  INDEX `fk_gif_comment_users1_idx` (`users_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_gif_comment_gifs1`
    FOREIGN KEY (`gifs_gif_id`)
    REFERENCES `teamwork`.`gifs` (`gif_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_gif_comment_users1`
    FOREIGN KEY (`users_user_id`)
    REFERENCES `teamwork`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- Sri Bhavan Crackers - MySQL Schema
-- Run this in phpMyAdmin or any MySQL client

CREATE TABLE IF NOT EXISTS `orders` (
  `id`                VARCHAR(36)  NOT NULL,
  `order_id`          VARCHAR(40)  NOT NULL UNIQUE,
  `user_id`           VARCHAR(255) DEFAULT NULL,
  `customer_name`     VARCHAR(255) NOT NULL,
  `customer_phone`    VARCHAR(20)  NOT NULL,
  `customer_alt_phone` VARCHAR(20) DEFAULT NULL,
  `address_line1`     TEXT         NOT NULL,
  `address_city`      VARCHAR(100) NOT NULL,
  `address_state`     VARCHAR(100) NOT NULL,
  `address_pincode`   VARCHAR(10)  NOT NULL,
  `subtotal`          DECIMAL(10,2) NOT NULL DEFAULT 0,
  `shipping`          DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_amount`      DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status`            ENUM('PENDING','CONFIRMED','SHIPPED','DELIVERED') NOT NULL DEFAULT 'PENDING',
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `order_id`     VARCHAR(36)  NOT NULL,
  `product_id`   VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `price`        DECIMAL(10,2) NOT NULL,
  `quantity`     INT          NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_order_ref` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `extra_products` (
  `id`               VARCHAR(100) NOT NULL,
  `name`             VARCHAR(255) NOT NULL,
  `category`         VARCHAR(100) DEFAULT NULL,
  `selling_price`    DECIMAL(10,2) NOT NULL DEFAULT 0,
  `old_price`        DECIMAL(10,2) DEFAULT NULL,
  `discount_percent` INT          DEFAULT 0,
  `stock`            INT          DEFAULT 10000,
  `image_url`        TEXT         DEFAULT NULL,
  `youtube_url`      TEXT         DEFAULT NULL,
  `duplicated_from`  VARCHAR(100) DEFAULT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE product_reviews
ADD COLUMN performance_rating TINYINT NOT NULL DEFAULT 5 AFTER rating,
ADD COLUMN battery_rating TINYINT NOT NULL DEFAULT 5 AFTER performance_rating,
ADD COLUMN camera_rating TINYINT NOT NULL DEFAULT 5 AFTER battery_rating;

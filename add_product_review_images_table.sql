CREATE TABLE IF NOT EXISTS product_review_images (
  id BIGINT NOT NULL AUTO_INCREMENT,
  review_id BIGINT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_review_images_review_id (review_id, sort_order),
  CONSTRAINT fk_product_review_images_review
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE
);

ALTER TABLE appointments
ADD COLUMN quote_date DATE AFTER quote_num;

ALTER TABLE appointments
ADD COLUMN invoice_date DATE AFTER invoice_num;

ALTER TABLE mutuals ADD `order` INT UNSIGNED NOT NULL DEFAULT 0;
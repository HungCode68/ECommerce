package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	db, err := sql.Open("mysql", "root:11042005@tcp(127.0.0.1:3306)/ECommerce?parseTime=true")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	query := `
		SELECT o.order_number,
		       COALESCE((
				SELECT GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.title) SEPARATOR '\n')
				FROM order_items oi
				WHERE oi.order_id = o.id
		       ), '') AS all_item_titles
		FROM orders o
		ORDER BY o.placed_at DESC
		LIMIT 5`

	rows, err := db.QueryContext(context.Background(), query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var orderNumber string
		var allItemTitles string
		if err := rows.Scan(&orderNumber, &allItemTitles); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Order: %s\nItems: %q\n---\n", orderNumber, allItemTitles)
	}
}

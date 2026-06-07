package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	db, err := sql.Open("mysql", "root:11042005@tcp(127.0.0.1:3306)/ECommerce?parseTime=true&loc=Asia%2FHo_Chi_Minh")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	query := `SELECT DATE(placed_at), SUM(total_amount) FROM orders WHERE payment_status = 'paid' GROUP BY DATE(placed_at)`
	rows, err := db.QueryContext(context.Background(), query)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		var d time.Time
		var r float64
		if err := rows.Scan(&d, &r); err != nil {
			fmt.Printf("Error: %v\n", err)
		} else {
			fmt.Printf("Date: %s, Revenue: %f\n", d.Format("2006-01-02"), r)
		}
	}
}

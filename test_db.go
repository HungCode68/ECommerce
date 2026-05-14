package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	db, err := sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/ecommerce")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, option_values FROM product_variants LIMIT 10")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var optionValues sql.NullString
		if err := rows.Scan(&id, &optionValues); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("ID: %d, OptionValues: %s\n", id, optionValues.String)
	}
}

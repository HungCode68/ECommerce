package main

import (
	"fmt"
	"golang/internal/configs/database"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	godotenv.Load()
	db := database.NewDatabaseConnection()
	if db == nil {
		log.Fatal("No DB")
	}
	defer db.Connection.Close()

	rows, err := db.Connection.Query("SELECT id, username, is_active, deleted_at FROM users")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var username string
		var isActive bool
		var deletedAt []byte
		err := rows.Scan(&id, &username, &isActive, &deletedAt)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("ID: %d, Username: %s, IsActive: %t, DeletedAt: %s\n", id, username, isActive, string(deletedAt))
	}
}

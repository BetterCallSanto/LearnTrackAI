package com.learntrack.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

@Component
public class MyntraDatabaseInitializer {

    private static final String DB_URL = "jdbc:sqlite:myntra_practice.db";

    @PostConstruct
    public void initDatabase() {
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement()) {

            // Enable foreign keys
            stmt.execute("PRAGMA foreign_keys = ON;");

            // 1. Create categories table
            stmt.execute("CREATE TABLE IF NOT EXISTS categories (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "name TEXT NOT NULL," +
                    "description TEXT" +
                    ");");

            // 2. Create products table
            stmt.execute("CREATE TABLE IF NOT EXISTS products (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "name TEXT NOT NULL," +
                    "description TEXT," +
                    "price REAL NOT NULL," +
                    "brand TEXT," +
                    "category_id INTEGER," +
                    "stock_quantity INTEGER DEFAULT 0," +
                    "rating REAL," +
                    "FOREIGN KEY (category_id) REFERENCES categories (id)" +
                    ");");

            // 3. Create users table
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "username TEXT NOT NULL," +
                    "email TEXT NOT NULL," +
                    "first_name TEXT," +
                    "last_name TEXT," +
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                    ");");

            // 4. Create orders table
            stmt.execute("CREATE TABLE IF NOT EXISTS orders (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "user_id INTEGER," +
                    "order_date DATETIME DEFAULT CURRENT_TIMESTAMP," +
                    "total_amount REAL," +
                    "status TEXT," +
                    "FOREIGN KEY (user_id) REFERENCES users (id)" +
                    ");");

            // 5. Create order_items table
            stmt.execute("CREATE TABLE IF NOT EXISTS order_items (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "order_id INTEGER," +
                    "product_id INTEGER," +
                    "quantity INTEGER," +
                    "price REAL," +
                    "FOREIGN KEY (order_id) REFERENCES orders (id)," +
                    "FOREIGN KEY (product_id) REFERENCES products (id)" +
                    ");");

            // 6. Create reviews table
            stmt.execute("CREATE TABLE IF NOT EXISTS reviews (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "product_id INTEGER," +
                    "user_id INTEGER," +
                    "rating INTEGER," +
                    "comment TEXT," +
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                    "FOREIGN KEY (product_id) REFERENCES products (id)," +
                    "FOREIGN KEY (user_id) REFERENCES users (id)" +
                    ");");

            // Check if data is seeded
            var rs = stmt.executeQuery("SELECT COUNT(*) AS count FROM categories");
            if (rs.next() && rs.getInt("count") == 0) {
                seedData(stmt);
            }

        } catch (Exception e) {
            System.err.println("Failed to initialize Myntra Practice SQLite database: " + e.getMessage());
        }
    }

    private void seedData(Statement stmt) throws Exception {
        // Seed Categories
        stmt.execute("INSERT INTO categories (name, description) VALUES " +
                "('Men Clothing', 'Men''s shirts, t-shirts, jeans, etc.')," +
                "('Women Clothing', 'Women''s dresses, tops, ethnic wear')," +
                "('Footwear', 'Shoes, sandals, sneakers')," +
                "('Accessories', 'Watches, belts, sunglasses');");

        // Seed Products
        stmt.execute("INSERT INTO products (name, description, price, brand, category_id, stock_quantity, rating) VALUES " +
                "('HRX Cotton T-Shirt', 'Solid black regular fit', 499.0, 'HRX', 1, 150, 4.2)," +
                "('Levis Slim Fit Jeans', 'Blue faded denim', 1999.0, 'Levis', 1, 80, 4.5)," +
                "('Biba Kurta Set', 'Yellow printed cotton kurta', 2499.0, 'Biba', 2, 40, 4.7)," +
                "('Puma Running Shoes', 'Lightweight sports shoes', 2999.0, 'Puma', 3, 60, 4.1)," +
                "('Fossil Chronograph Watch', 'Brown leather strap', 8499.0, 'Fossil', 4, 25, 4.8)," +
                "('H&M Crop Top', 'White casual top', 799.0, 'H&M', 2, 100, 4.0)," +
                "('Nike Air Max', 'Black running sneakers', 6999.0, 'Nike', 3, 45, 4.6)," +
                "('Wrangler Denim Jacket', 'Blue denim jacket', 3499.0, 'Wrangler', 1, 30, 4.3);");

        // Seed Users
        stmt.execute("INSERT INTO users (username, email, first_name, last_name) VALUES " +
                "('john_doe', 'john@example.com', 'John', 'Doe')," +
                "('jane_smith', 'jane@example.com', 'Jane', 'Smith')," +
                "('rahul_raj', 'rahul@example.com', 'Rahul', 'Raj');");

        // Seed Orders
        stmt.execute("INSERT INTO orders (user_id, total_amount, status) VALUES " +
                "(1, 2498.0, 'Delivered')," +
                "(2, 2499.0, 'Shipped')," +
                "(3, 8499.0, 'Processing');");

        // Seed Order Items
        stmt.execute("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES " +
                "(1, 1, 1, 499.0)," +
                "(1, 2, 1, 1999.0)," +
                "(2, 3, 1, 2499.0)," +
                "(3, 5, 1, 8499.0);");

        // Seed Reviews
        stmt.execute("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES " +
                "(1, 1, 4, 'Good quality cotton.')," +
                "(2, 1, 5, 'Perfect fit!')," +
                "(3, 2, 5, 'Beautiful print and color.');");
                
        System.out.println("Myntra Practice database seeded successfully.");
    }
}

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ADMIN_NAME = process.env.ADMIN_NAME || "Store Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@atelierfurnish.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const dbPath = path.join(__dirname, "furniture.sqlite");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const seedProducts = [
  {
    name: "Nordic Cloud Sofa",
    category: "Sofas",
    price: 1199,
    image:
      "https://images.pexels.com/photos/6585758/pexels-photo-6585758.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "A deep-seat three-seater with soft boucle texture and walnut base accents.",
    rating: 4.8,
    stock: 9,
    isFeatured: 1,
    material: "Boucle and kiln-dried wood",
    dimensions: "88in W x 38in D x 32in H",
    color: "Oatmeal",
  },
  {
    name: "Arbor Oak Dining Table",
    category: "Tables",
    price: 899,
    image:
      "https://images.pexels.com/photos/5824484/pexels-photo-5824484.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Solid oak top with tapered legs, sized for six with a matte natural finish.",
    rating: 4.7,
    stock: 6,
    isFeatured: 1,
    material: "Solid oak",
    dimensions: "72in W x 36in D x 30in H",
    color: "Natural Oak",
  },
  {
    name: "Halo Lounge Chair",
    category: "Chairs",
    price: 479,
    image:
      "https://images.pexels.com/photos/1139785/pexels-photo-1139785.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Curved silhouette lounge chair with plush cushioning and brushed brass feet.",
    rating: 4.6,
    stock: 14,
    isFeatured: 1,
    material: "Performance linen and steel",
    dimensions: "31in W x 33in D x 30in H",
    color: "Sand",
  },
  {
    name: "Cedar Platform Bed",
    category: "Beds",
    price: 1349,
    image:
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Low profile queen bed frame with floating side rails and hidden support beams.",
    rating: 4.9,
    stock: 5,
    isFeatured: 1,
    material: "Cedar veneer and steel",
    dimensions: "86in W x 64in D x 42in H",
    color: "Warm Walnut",
  },
  {
    name: "Mira Accent Cabinet",
    category: "Storage",
    price: 649,
    image:
      "https://images.pexels.com/photos/276671/pexels-photo-276671.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Textured ribbed-front cabinet with soft-close doors and adjustable shelves.",
    rating: 4.5,
    stock: 11,
    isFeatured: 0,
    material: "Ash veneer",
    dimensions: "48in W x 18in D x 34in H",
    color: "Smoked Ash",
  },
  {
    name: "Orbit Floor Lamp",
    category: "Lighting",
    price: 259,
    image:
      "https://images.pexels.com/photos/6438759/pexels-photo-6438759.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Sculptural arc lamp with dimmable warm LED and marble weighted base.",
    rating: 4.4,
    stock: 20,
    isFeatured: 0,
    material: "Powder-coated steel and marble",
    dimensions: "68in H",
    color: "Matte Black",
  },
  {
    name: "Luna Coffee Table",
    category: "Tables",
    price: 529,
    image:
      "https://images.pexels.com/photos/2082087/pexels-photo-2082087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Rounded travertine-look coffee table with hidden drawer for living-room essentials.",
    rating: 4.6,
    stock: 12,
    isFeatured: 0,
    material: "Engineered stone and oak",
    dimensions: "44in W x 28in D x 15in H",
    color: "Ivory Stone",
  },
  {
    name: "Sora Modular Sectional",
    category: "Sofas",
    price: 1899,
    image:
      "https://images.pexels.com/photos/6585761/pexels-photo-6585761.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Four-piece sectional with configurable chaise and removable performance covers.",
    rating: 4.9,
    stock: 4,
    isFeatured: 1,
    material: "Performance weave",
    dimensions: "118in W x 72in D x 33in H",
    color: "Pebble Gray",
  },
  {
    name: "Drift Nightstand",
    category: "Storage",
    price: 219,
    image:
      "https://images.pexels.com/photos/6585597/pexels-photo-6585597.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Compact two-drawer nightstand with cord cutout and soft-close rails.",
    rating: 4.3,
    stock: 24,
    isFeatured: 0,
    material: "Walnut veneer",
    dimensions: "22in W x 16in D x 20in H",
    color: "Walnut",
  },
  {
    name: "Aster Dining Chair (Set of 2)",
    category: "Chairs",
    price: 389,
    image:
      "https://images.pexels.com/photos/6489137/pexels-photo-6489137.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Ergonomic curved back chairs with stain-resistant upholstery and oak legs.",
    rating: 4.7,
    stock: 16,
    isFeatured: 0,
    material: "Textured polyester and oak",
    dimensions: "19in W x 22in D x 33in H",
    color: "Stone Beige",
  },
  {
    name: "Serene Bench",
    category: "Chairs",
    price: 299,
    image:
      "https://images.pexels.com/photos/6585602/pexels-photo-6585602.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Minimal bench ideal for entryways, bedroom corners, or dining table extension.",
    rating: 4.2,
    stock: 18,
    isFeatured: 0,
    material: "Ash wood and linen",
    dimensions: "48in W x 16in D x 18in H",
    color: "Natural Ash",
  },
  {
    name: "Vela Pendant Lamp",
    category: "Lighting",
    price: 199,
    image:
      "https://images.pexels.com/photos/6489152/pexels-photo-6489152.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Hand-blown glass pendant with adjustable cord and soft warm glow.",
    rating: 4.5,
    stock: 22,
    isFeatured: 0,
    material: "Blown glass and brass",
    dimensions: "12in Diameter",
    color: "Amber",
  },
];

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      material TEXT,
      dimensions TEXT,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      shipping_address TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const hasRoleColumn = userColumns.some((column) => column.name === "role");
  if (!hasRoleColumn) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
  }

  const existingCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  if (existingCount === 0) {
    const insert = db.prepare(`
      INSERT INTO products (
        name,
        category,
        price,
        image,
        description,
        rating,
        stock,
        is_featured,
        material,
        dimensions,
        color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((products) => {
      for (const product of products) {
        insert.run(
          product.name,
          product.category,
          product.price,
          product.image,
          product.description,
          product.rating,
          product.stock,
          product.isFeatured,
          product.material,
          product.dimensions,
          product.color
        );
      }
    });

    transaction(seedProducts);
  }

  const normalizedAdminEmail = String(ADMIN_EMAIL).trim().toLowerCase();
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedAdminEmail);
  const adminPasswordHash = bcrypt.hashSync(String(ADMIN_PASSWORD), 10);

  if (!existingAdmin) {
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
    ).run(String(ADMIN_NAME).trim(), normalizedAdminEmail, adminPasswordHash);
  } else {
    db.prepare(
      "UPDATE users SET name = ?, role = 'admin', password_hash = ? WHERE id = ?"
    ).run(String(ADMIN_NAME).trim(), adminPasswordHash, existingAdmin.id);
  }
}

initDatabase();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function adminRequired(req, res, next) {
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
}

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);

  if (existing) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
    .run(String(name).trim(), normalizedEmail, passwordHash);

  const user = db
    .prepare("SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  const token = createToken(user);
  return res.status(201).json({ user, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db
    .prepare(
      "SELECT id, name, email, role, password_hash, created_at AS createdAt FROM users WHERE email = ?"
    )
    .get(normalizedEmail);

  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = createToken(user);
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  return res.json({ user: safeUser, token });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user });
});

app.get("/api/products", (req, res) => {
  const { category, search, sort, minPrice, maxPrice } = req.query;
  let query = `
    SELECT
      id,
      name,
      category,
      price,
      image,
      description,
      rating,
      stock,
      is_featured AS isFeatured,
      material,
      dimensions,
      color
    FROM products
    WHERE 1 = 1
  `;
  const params = [];

  if (category && String(category).toLowerCase() !== "all") {
    query += " AND LOWER(category) = LOWER(?)";
    params.push(String(category));
  }

  if (search) {
    query += " AND (name LIKE ? OR description LIKE ? OR category LIKE ?)";
    const like = `%${String(search).trim()}%`;
    params.push(like, like, like);
  }

  if (minPrice) {
    query += " AND price >= ?";
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    query += " AND price <= ?";
    params.push(Number(maxPrice));
  }

  switch (sort) {
    case "price_asc":
      query += " ORDER BY price ASC";
      break;
    case "price_desc":
      query += " ORDER BY price DESC";
      break;
    case "rating":
      query += " ORDER BY rating DESC";
      break;
    case "newest":
      query += " ORDER BY id DESC";
      break;
    default:
      query += " ORDER BY is_featured DESC, rating DESC";
      break;
  }

  const products = db.prepare(query).all(...params);
  return res.json({ products });
});

app.get("/api/products/:id", (req, res) => {
  const product = db
    .prepare(
      `
      SELECT
        id,
        name,
        category,
        price,
        image,
        description,
        rating,
        stock,
        is_featured AS isFeatured,
        material,
        dimensions,
        color
      FROM products
      WHERE id = ?
    `
    )
    .get(Number(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  return res.json({ product });
});

app.post("/api/orders", authRequired, (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order must include at least one item." });
  }

  if (!shippingAddress || String(shippingAddress).trim().length < 10) {
    return res.status(400).json({ message: "Shipping address is required." });
  }

  const resolvedItems = [];

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid order item payload." });
    }

    const product = db
      .prepare("SELECT id, name, price, stock FROM products WHERE id = ?")
      .get(productId);

    if (!product) {
      return res.status(404).json({ message: `Product ${productId} not found.` });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Not enough stock for ${product.name}. Remaining stock: ${product.stock}`,
      });
    }

    resolvedItems.push({
      productId: product.id,
      quantity,
      price: product.price,
    });
  }

  const total = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare(
        "INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)"
      )
      .run(req.user.id, total, String(shippingAddress).trim());

    const orderId = Number(orderResult.lastInsertRowid);
    const insertOrderItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
    );
    const reduceStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    for (const item of resolvedItems) {
      insertOrderItem.run(orderId, item.productId, item.quantity, item.price);
      reduceStock.run(item.quantity, item.productId);
    }

    return orderId;
  });

  const orderId = createOrder();

  const order = db
    .prepare(
      `
      SELECT
        id,
        total,
        status,
        shipping_address AS shippingAddress,
        created_at AS createdAt
      FROM orders
      WHERE id = ?
    `
    )
    .get(orderId);

  const orderItems = db
    .prepare(
      `
      SELECT
        oi.product_id AS productId,
        p.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `
    )
    .all(orderId);

  return res.status(201).json({ order: { ...order, items: orderItems } });
});

app.get("/api/orders", authRequired, (req, res) => {
  const orders = db
    .prepare(
      `
      SELECT
        o.id,
        o.total,
        o.status,
        o.shipping_address AS shippingAddress,
        o.created_at AS createdAt,
        COUNT(oi.id) AS itemCount
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    )
    .all(req.user.id);

  return res.json({ orders });
});

app.get("/api/admin/summary", authRequired, adminRequired, (_req, res) => {
  const summary = db
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM users) AS userCount,
        (SELECT COUNT(*) FROM products) AS productCount,
        (SELECT COUNT(*) FROM orders) AS orderCount,
        (SELECT COUNT(*) FROM orders WHERE status = 'processing') AS processingOrders,
        (SELECT COUNT(*) FROM products WHERE stock <= 5) AS lowStockProducts,
        COALESCE((SELECT SUM(total) FROM orders), 0) AS totalRevenue
    `
    )
    .get();

  const recentOrders = db
    .prepare(
      `
      SELECT
        o.id,
        o.total,
        o.status,
        o.created_at AS createdAt,
        u.name AS customerName,
        u.email AS customerEmail,
        COUNT(oi.id) AS itemCount
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `
    )
    .all();

  return res.json({ summary, recentOrders });
});

app.get("/api/admin/orders", authRequired, adminRequired, (_req, res) => {
  const orders = db
    .prepare(
      `
      SELECT
        o.id,
        o.total,
        o.status,
        o.shipping_address AS shippingAddress,
        o.created_at AS createdAt,
        u.name AS customerName,
        u.email AS customerEmail,
        COUNT(oi.id) AS itemCount
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    )
    .all();

  return res.json({ orders });
});

app.patch("/api/admin/orders/:id/status", authRequired, adminRequired, (req, res) => {
  const orderId = Number(req.params.id);
  const status = String(req.body.status || "").trim().toLowerCase();
  const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];

  if (!Number.isInteger(orderId) || orderId < 1) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }

  const result = db
    .prepare("UPDATE orders SET status = ? WHERE id = ?")
    .run(status, orderId);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Order not found." });
  }

  const order = db
    .prepare(
      `
      SELECT
        o.id,
        o.total,
        o.status,
        o.shipping_address AS shippingAddress,
        o.created_at AS createdAt,
        u.name AS customerName,
        u.email AS customerEmail,
        COUNT(oi.id) AS itemCount
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ?
      GROUP BY o.id
    `
    )
    .get(orderId);

  return res.json({ order });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Furniture API running on http://localhost:${PORT}`);
  });
}

module.exports = app;

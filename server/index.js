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
      subtotal REAL NOT NULL DEFAULT 0,
      shipping_fee REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
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

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(product_id, user_id),
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percent', 'fixed')),
      discount_value REAL NOT NULL,
      min_order_amount REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const hasRoleColumn = userColumns.some((column) => column.name === "role");
  if (!hasRoleColumn) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
  }

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all();
  const hasSubtotalColumn = orderColumns.some((column) => column.name === "subtotal");
  const hasShippingFeeColumn = orderColumns.some((column) => column.name === "shipping_fee");
  const hasDiscountAmountColumn = orderColumns.some(
    (column) => column.name === "discount_amount"
  );
  const hasCouponCodeColumn = orderColumns.some((column) => column.name === "coupon_code");

  if (!hasSubtotalColumn) {
    db.exec("ALTER TABLE orders ADD COLUMN subtotal REAL NOT NULL DEFAULT 0");
  }
  if (!hasShippingFeeColumn) {
    db.exec("ALTER TABLE orders ADD COLUMN shipping_fee REAL NOT NULL DEFAULT 0");
  }
  if (!hasDiscountAmountColumn) {
    db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0");
  }
  if (!hasCouponCodeColumn) {
    db.exec("ALTER TABLE orders ADD COLUMN coupon_code TEXT");
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

  const couponCount = db.prepare("SELECT COUNT(*) AS count FROM coupons").get().count;
  if (couponCount === 0) {
    const insertCoupon = db.prepare(
      `
      INSERT INTO coupons (
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        is_active,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    );

    insertCoupon.run(
      "WELCOME10",
      "10% off your first order",
      "percent",
      10,
      0,
      1,
      null
    );
    insertCoupon.run(
      "LIVING50",
      "$50 off orders over $1,000",
      "fixed",
      50,
      1000,
      1,
      null
    );
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

function parseAuthToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

function authRequired(req, res, next) {
  const token = parseAuthToken(req);

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

function authOptional(req, _res, next) {
  const token = parseAuthToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }

  return next();
}

function adminRequired(req, res, next) {
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
}

const productFieldToColumn = {
  name: "name",
  category: "category",
  price: "price",
  image: "image",
  description: "description",
  rating: "rating",
  stock: "stock",
  isFeatured: "is_featured",
  material: "material",
  dimensions: "dimensions",
  color: "color",
};

const couponFieldToColumn = {
  code: "code",
  description: "description",
  discountType: "discount_type",
  discountValue: "discount_value",
  minOrderAmount: "min_order_amount",
  isActive: "is_active",
  expiresAt: "expires_at",
};
const FREE_SHIPPING_THRESHOLD = 1000;
const DEFAULT_SHIPPING_FEE = 49;

function parseProductPayload(input, requireAllFields = false) {
  const payload = {};
  const body = input || {};

  const handleText = (field, required = false, allowNull = false) => {
    if (body[field] === undefined) {
      if (required) {
        return `${field} is required.`;
      }
      return null;
    }

    const text = String(body[field]).trim();
    if (!text) {
      if (allowNull) {
        payload[field] = null;
        return null;
      }
      return `${field} cannot be empty.`;
    }

    payload[field] = text;
    return null;
  };

  const handleNumber = (field, required = false, min = null, max = null, integer = false) => {
    if (body[field] === undefined) {
      if (required) {
        return `${field} is required.`;
      }
      return null;
    }

    const numeric = Number(body[field]);
    if (!Number.isFinite(numeric)) {
      return `${field} must be a valid number.`;
    }

    if (integer && !Number.isInteger(numeric)) {
      return `${field} must be an integer.`;
    }

    if (min !== null && numeric < min) {
      return `${field} must be at least ${min}.`;
    }

    if (max !== null && numeric > max) {
      return `${field} must be at most ${max}.`;
    }

    payload[field] = numeric;
    return null;
  };

  const handleFeatured = (required = false) => {
    if (body.isFeatured === undefined) {
      if (required) {
        payload.isFeatured = 0;
      }
      return null;
    }

    if (typeof body.isFeatured === "boolean") {
      payload.isFeatured = body.isFeatured ? 1 : 0;
      return null;
    }

    const normalized = String(body.isFeatured).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      payload.isFeatured = 1;
      return null;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      payload.isFeatured = 0;
      return null;
    }

    return "isFeatured must be true/false.";
  };

  const required = requireAllFields;
  const firstError =
    handleText("name", required) ||
    handleText("category", required) ||
    handleText("image", required) ||
    handleText("description", required) ||
    handleNumber("price", required, 0.01, null, false) ||
    handleNumber("rating", false, 0, 5, false) ||
    handleNumber("stock", required, 0, null, true) ||
    handleFeatured(required) ||
    handleText("material", false, true) ||
    handleText("dimensions", false, true) ||
    handleText("color", false, true);

  if (firstError) {
    return { error: firstError, payload: null };
  }

  return { error: null, payload };
}

function fetchProductById(productId) {
  return db
    .prepare(
      `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.image,
        p.description,
        COALESCE(ra.avgRating, p.rating) AS rating,
        COALESCE(ra.reviewCount, 0) AS reviewCount,
        p.stock,
        p.is_featured AS isFeatured,
        p.material,
        p.dimensions,
        p.color
      FROM products p
      LEFT JOIN (
        SELECT
          product_id,
          AVG(rating) AS avgRating,
          COUNT(*) AS reviewCount
        FROM reviews
        GROUP BY product_id
      ) ra ON ra.product_id = p.id
      WHERE p.id = ?
    `
    )
    .get(productId);
}

function parseSqliteDate(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).includes("T")
    ? String(value)
    : `${String(value).replace(" ", "T")}Z`;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
}

function computeShippingFee(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

function fetchCouponByCode(code) {
  return db
    .prepare(
      `
      SELECT
        id,
        code,
        description,
        discount_type AS discountType,
        discount_value AS discountValue,
        min_order_amount AS minOrderAmount,
        is_active AS isActive,
        expires_at AS expiresAt
      FROM coupons
      WHERE UPPER(code) = UPPER(?)
    `
    )
    .get(code);
}

function evaluateCoupon(code, subtotal) {
  if (!code || !String(code).trim()) {
    return { valid: false, message: "Coupon code is required." };
  }

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { valid: false, message: "Subtotal must be greater than 0." };
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const coupon = fetchCouponByCode(normalizedCode);
  if (!coupon) {
    return { valid: false, message: "Coupon not found." };
  }

  if (!coupon.isActive) {
    return { valid: false, message: "Coupon is inactive." };
  }

  const expiryDate = parseSqliteDate(coupon.expiresAt);
  if (expiryDate && expiryDate.getTime() < Date.now()) {
    return { valid: false, message: "Coupon has expired." };
  }

  if (subtotal < Number(coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      message: `Coupon requires a minimum order of $${Number(coupon.minOrderAmount).toFixed(2)}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percent") {
    discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
  } else if (coupon.discountType === "fixed") {
    discountAmount = Number(coupon.discountValue);
  } else {
    return { valid: false, message: "Coupon configuration is invalid." };
  }

  discountAmount = Math.max(0, Math.min(Number(subtotal.toFixed(2)), Number(discountAmount.toFixed(2))));

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: Number(coupon.minOrderAmount),
      isActive: Number(coupon.isActive),
      expiresAt: coupon.expiresAt,
    },
    discountAmount,
  };
}

function fetchCouponById(id) {
  return db
    .prepare(
      `
      SELECT
        id,
        code,
        description,
        discount_type AS discountType,
        discount_value AS discountValue,
        min_order_amount AS minOrderAmount,
        is_active AS isActive,
        expires_at AS expiresAt,
        created_at AS createdAt
      FROM coupons
      WHERE id = ?
    `
    )
    .get(id);
}

function parseCouponPayload(input, requireAllFields = false) {
  const payload = {};
  const body = input || {};

  const requireField = (field) => requireAllFields && body[field] === undefined;

  if (requireField("code")) {
    return { error: "code is required.", payload: null };
  }
  if (body.code !== undefined) {
    const code = String(body.code).trim().toUpperCase();
    if (!code) {
      return { error: "code cannot be empty.", payload: null };
    }
    payload.code = code;
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim();
    payload.description = description || null;
  }

  if (requireField("discountType")) {
    return { error: "discountType is required.", payload: null };
  }
  if (body.discountType !== undefined) {
    const type = String(body.discountType).trim().toLowerCase();
    if (!["percent", "fixed"].includes(type)) {
      return { error: "discountType must be percent or fixed.", payload: null };
    }
    payload.discountType = type;
  }

  if (requireField("discountValue")) {
    return { error: "discountValue is required.", payload: null };
  }
  if (body.discountValue !== undefined) {
    const discountValue = Number(body.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return { error: "discountValue must be greater than 0.", payload: null };
    }
    payload.discountValue = discountValue;
  }

  if (requireField("minOrderAmount")) {
    payload.minOrderAmount = 0;
  }
  if (body.minOrderAmount !== undefined) {
    const minOrderAmount = Number(body.minOrderAmount);
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return { error: "minOrderAmount must be >= 0.", payload: null };
    }
    payload.minOrderAmount = minOrderAmount;
  }

  if (body.isActive !== undefined) {
    const raw = body.isActive;
    if (typeof raw === "boolean") {
      payload.isActive = raw ? 1 : 0;
    } else {
      const normalized = String(raw).trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalized)) {
        payload.isActive = 1;
      } else if (["0", "false", "no", "off"].includes(normalized)) {
        payload.isActive = 0;
      } else {
        return { error: "isActive must be true or false.", payload: null };
      }
    }
  } else if (requireAllFields) {
    payload.isActive = 1;
  }

  if (body.expiresAt !== undefined) {
    const expiresAt = String(body.expiresAt).trim();
    if (!expiresAt) {
      payload.expiresAt = null;
    } else {
      const parsed = Date.parse(expiresAt);
      if (Number.isNaN(parsed)) {
        return { error: "expiresAt must be a valid date.", payload: null };
      }
      payload.expiresAt = new Date(parsed).toISOString();
    }
  }

  if (
    payload.discountType === "percent" &&
    payload.discountValue !== undefined &&
    payload.discountValue > 100
  ) {
    return { error: "Percent discount cannot exceed 100.", payload: null };
  }

  return { error: null, payload };
}

const PRODUCT_SELECT_FIELDS = `
  p.id,
  p.name,
  p.category,
  p.price,
  p.image,
  p.description,
  COALESCE(ra.avgRating, p.rating) AS rating,
  COALESCE(ra.reviewCount, 0) AS reviewCount,
  p.stock,
  p.is_featured AS isFeatured,
  p.material,
  p.dimensions,
  p.color
`;

const PRODUCT_REVIEW_AGG_JOIN = `
  LEFT JOIN (
    SELECT
      product_id,
      AVG(rating) AS avgRating,
      COUNT(*) AS reviewCount
    FROM reviews
    GROUP BY product_id
  ) ra ON ra.product_id = p.id
`;

function fetchProductsWithReviews({ whereClause = "1 = 1", params = [], orderBy = "p.id DESC", limit = null }) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : null;
  const limitSql = safeLimit ? ` LIMIT ${safeLimit}` : "";

  const query = `
    SELECT
      ${PRODUCT_SELECT_FIELDS}
    FROM products p
    ${PRODUCT_REVIEW_AGG_JOIN}
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    ${limitSql}
  `;

  return db.prepare(query).all(...params);
}

function getPreferredCategoriesForUser(userId) {
  return db
    .prepare(
      `
      SELECT
        category,
        COUNT(*) AS score
      FROM (
        SELECT p.category AS category
        FROM wishlist_items wi
        JOIN products p ON p.id = wi.product_id
        WHERE wi.user_id = ?

        UNION ALL

        SELECT p.category AS category
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = ?

        UNION ALL

        SELECT p.category AS category
        FROM reviews r
        JOIN products p ON p.id = r.product_id
        WHERE r.user_id = ?
      ) interactions
      GROUP BY category
      ORDER BY score DESC, category ASC
      LIMIT 3
    `
    )
    .all(userId, userId, userId)
    .map((item) => item.category);
}

function getExcludedProductIdsForUser(userId) {
  const rows = db
    .prepare(
      `
      SELECT DISTINCT productId
      FROM (
        SELECT wi.product_id AS productId
        FROM wishlist_items wi
        WHERE wi.user_id = ?

        UNION

        SELECT oi.product_id AS productId
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = ?
      ) merged
    `
    )
    .all(userId, userId);

  return rows.map((item) => Number(item.productId));
}

function fetchRecommendedProducts(userId, limit = 8) {
  const preferredCategories = getPreferredCategoriesForUser(userId);
  const excludedIds = getExcludedProductIdsForUser(userId);
  const params = [];
  const conditions = [];

  if (preferredCategories.length > 0) {
    conditions.push(`p.category IN (${preferredCategories.map(() => "?").join(", ")})`);
    params.push(...preferredCategories);
  }

  if (excludedIds.length > 0) {
    conditions.push(`p.id NOT IN (${excludedIds.map(() => "?").join(", ")})`);
    params.push(...excludedIds);
  }

  const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1 = 1";
  let products = fetchProductsWithReviews({
    whereClause,
    params,
    orderBy: "p.is_featured DESC, COALESCE(ra.avgRating, p.rating) DESC, p.id DESC",
    limit,
  });

  if (products.length < limit) {
    const fallbackConditions = excludedIds.length
      ? [`p.id NOT IN (${excludedIds.map(() => "?").join(", ")})`]
      : ["1 = 1"];
    const fallbackProducts = fetchProductsWithReviews({
      whereClause: fallbackConditions.join(" AND "),
      params: excludedIds.length ? excludedIds : [],
      orderBy: "p.is_featured DESC, COALESCE(ra.avgRating, p.rating) DESC, p.id DESC",
      limit: limit * 2,
    });

    const seen = new Set(products.map((product) => product.id));
    for (const product of fallbackProducts) {
      if (!seen.has(product.id)) {
        products.push(product);
        seen.add(product.id);
      }
      if (products.length >= limit) {
        break;
      }
    }
  }

  const reason =
    preferredCategories.length > 0
      ? `Based on your interest in ${preferredCategories.join(", ")}`
      : "Popular picks for your home";

  return { products: products.slice(0, limit), reason };
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
      p.id,
      p.name,
      p.category,
      p.price,
      p.image,
      p.description,
      COALESCE(ra.avgRating, p.rating) AS rating,
      COALESCE(ra.reviewCount, 0) AS reviewCount,
      p.stock,
      p.is_featured AS isFeatured,
      p.material,
      p.dimensions,
      p.color
    FROM products p
    LEFT JOIN (
      SELECT
        product_id,
        AVG(rating) AS avgRating,
        COUNT(*) AS reviewCount
      FROM reviews
      GROUP BY product_id
    ) ra ON ra.product_id = p.id
    WHERE 1 = 1
  `;
  const params = [];

  if (category && String(category).toLowerCase() !== "all") {
    query += " AND LOWER(p.category) = LOWER(?)";
    params.push(String(category));
  }

  if (search) {
    query += " AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)";
    const like = `%${String(search).trim()}%`;
    params.push(like, like, like);
  }

  if (minPrice) {
    query += " AND p.price >= ?";
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    query += " AND p.price <= ?";
    params.push(Number(maxPrice));
  }

  switch (sort) {
    case "price_asc":
      query += " ORDER BY p.price ASC";
      break;
    case "price_desc":
      query += " ORDER BY p.price DESC";
      break;
    case "rating":
      query += " ORDER BY COALESCE(ra.avgRating, p.rating) DESC";
      break;
    case "newest":
      query += " ORDER BY p.id DESC";
      break;
    default:
      query += " ORDER BY p.is_featured DESC, COALESCE(ra.avgRating, p.rating) DESC";
      break;
  }

  const products = db.prepare(query).all(...params);
  return res.json({ products });
});

app.get("/api/products/:id", (req, res) => {
  const product = fetchProductById(Number(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  return res.json({ product });
});

app.get("/api/products/:id/reviews", (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const productExists = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!productExists) {
    return res.status(404).json({ message: "Product not found." });
  }

  const reviews = db
    .prepare(
      `
      SELECT
        r.id,
        r.product_id AS productId,
        r.user_id AS userId,
        u.name AS userName,
        r.rating,
        r.comment,
        r.created_at AS createdAt
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `
    )
    .all(productId);

  return res.json({ reviews });
});

app.post("/api/products/:id/reviews", authRequired, (req, res) => {
  const productId = Number(req.params.id);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const productExists = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!productExists) {
    return res.status(404).json({ message: "Product not found." });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be an integer from 1 to 5." });
  }

  if (comment.length < 3) {
    return res.status(400).json({ message: "Comment must be at least 3 characters." });
  }

  if (comment.length > 700) {
    return res.status(400).json({ message: "Comment is too long." });
  }

  db.prepare(
    `
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(product_id, user_id)
      DO UPDATE SET
        rating = excluded.rating,
        comment = excluded.comment,
        created_at = datetime('now')
    `
  ).run(productId, req.user.id, rating, comment);

  const review = db
    .prepare(
      `
      SELECT
        r.id,
        r.product_id AS productId,
        r.user_id AS userId,
        u.name AS userName,
        r.rating,
        r.comment,
        r.created_at AS createdAt
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? AND r.user_id = ?
    `
    )
    .get(productId, req.user.id);

  return res.status(201).json({ review });
});

app.get("/api/wishlist", authRequired, (req, res) => {
  const products = db
    .prepare(
      `
      SELECT
        ${PRODUCT_SELECT_FIELDS}
      FROM wishlist_items wi
      JOIN products p ON p.id = wi.product_id
      ${PRODUCT_REVIEW_AGG_JOIN}
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC
    `
    )
    .all(req.user.id);

  return res.json({ products });
});

app.post("/api/wishlist/:productId", authRequired, (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const productExists = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!productExists) {
    return res.status(404).json({ message: "Product not found." });
  }

  db.prepare(
    `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES (?, ?)
      ON CONFLICT(user_id, product_id) DO NOTHING
    `
  ).run(req.user.id, productId);

  const product = fetchProductById(productId);
  return res.status(201).json({ product });
});

app.delete("/api/wishlist/:productId", authRequired, (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  db.prepare("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?").run(
    req.user.id,
    productId
  );

  return res.json({ success: true });
});

app.get("/api/recommendations", authOptional, (req, res) => {
  if (req.user && req.user.id) {
    const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(req.user.id);
    if (userExists) {
      const recommendation = fetchRecommendedProducts(req.user.id, 8);
      return res.json({
        products: recommendation.products,
        reason: recommendation.reason,
      });
    }
  }

  const products = fetchProductsWithReviews({
    orderBy: "p.is_featured DESC, COALESCE(ra.avgRating, p.rating) DESC, p.id DESC",
    limit: 8,
  });
  return res.json({ products, reason: "Popular picks for your home" });
});

app.get("/api/coupons/validate", (req, res) => {
  const { code, subtotal } = req.query;
  const numericSubtotal = Number(subtotal);

  const evaluated = evaluateCoupon(code, numericSubtotal);
  if (!evaluated.valid) {
    return res.status(400).json({ message: evaluated.message });
  }

  return res.json({
    coupon: evaluated.coupon,
    discountAmount: evaluated.discountAmount,
  });
});

app.post("/api/orders", authRequired, (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;

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

  const subtotal = Number(
    resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  const shippingFee = computeShippingFee(subtotal);

  let discountAmount = 0;
  let appliedCouponCode = null;
  if (couponCode && String(couponCode).trim()) {
    const evaluated = evaluateCoupon(couponCode, subtotal);
    if (!evaluated.valid) {
      return res.status(400).json({ message: evaluated.message });
    }
    discountAmount = evaluated.discountAmount;
    appliedCouponCode = evaluated.coupon.code;
  }

  const total = Number(Math.max(0, subtotal + shippingFee - discountAmount).toFixed(2));

  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare(
        `
        INSERT INTO orders (
          user_id,
          subtotal,
          shipping_fee,
          discount_amount,
          coupon_code,
          total,
          shipping_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        req.user.id,
        subtotal,
        shippingFee,
        discountAmount,
        appliedCouponCode,
        total,
        String(shippingAddress).trim()
      );

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
        subtotal,
        shipping_fee AS shippingFee,
        discount_amount AS discountAmount,
        coupon_code AS couponCode,
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
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.discount_amount AS discountAmount,
        o.coupon_code AS couponCode,
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
        (SELECT COUNT(*) FROM coupons) AS couponCount,
        (SELECT COUNT(*) FROM coupons WHERE is_active = 1) AS activeCoupons,
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
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.discount_amount AS discountAmount,
        o.coupon_code AS couponCode,
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
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.discount_amount AS discountAmount,
        o.coupon_code AS couponCode,
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

app.get("/api/admin/products", authRequired, adminRequired, (_req, res) => {
  const products = db
    .prepare(
      `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.image,
        p.description,
        COALESCE(ra.avgRating, p.rating) AS rating,
        COALESCE(ra.reviewCount, 0) AS reviewCount,
        p.stock,
        p.is_featured AS isFeatured,
        p.material,
        p.dimensions,
        p.color
      FROM products p
      LEFT JOIN (
        SELECT
          product_id,
          AVG(rating) AS avgRating,
          COUNT(*) AS reviewCount
        FROM reviews
        GROUP BY product_id
      ) ra ON ra.product_id = p.id
      ORDER BY p.id DESC
    `
    )
    .all();

  return res.json({ products });
});

app.post("/api/admin/products", authRequired, adminRequired, (req, res) => {
  const { error, payload } = parseProductPayload(req.body, true);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const result = db
    .prepare(
      `
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
    `
    )
    .run(
      payload.name,
      payload.category,
      payload.price,
      payload.image,
      payload.description,
      payload.rating ?? 0,
      payload.stock,
      payload.isFeatured ?? 0,
      payload.material ?? null,
      payload.dimensions ?? null,
      payload.color ?? null
    );

  const product = fetchProductById(Number(result.lastInsertRowid));
  return res.status(201).json({ product });
});

app.patch("/api/admin/products/:id", authRequired, adminRequired, (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!existing) {
    return res.status(404).json({ message: "Product not found." });
  }

  const { error, payload } = parseProductPayload(req.body, false);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return res.status(400).json({ message: "No valid fields supplied for update." });
  }

  const setClause = entries
    .map(([field]) => `${productFieldToColumn[field]} = ?`)
    .join(", ");
  const values = entries.map(([, value]) => value);

  db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values, productId);

  const product = fetchProductById(productId);
  return res.json({ product });
});

app.delete("/api/admin/products/:id", authRequired, adminRequired, (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!existing) {
    return res.status(404).json({ message: "Product not found." });
  }

  const linkedOrderItems = db
    .prepare("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?")
    .get(productId).count;

  if (linkedOrderItems > 0) {
    return res.status(409).json({
      message: "This product is linked to past orders and cannot be deleted.",
    });
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(productId);
  return res.json({ success: true });
});

app.get("/api/admin/coupons", authRequired, adminRequired, (_req, res) => {
  const coupons = db
    .prepare(
      `
      SELECT
        id,
        code,
        description,
        discount_type AS discountType,
        discount_value AS discountValue,
        min_order_amount AS minOrderAmount,
        is_active AS isActive,
        expires_at AS expiresAt,
        created_at AS createdAt
      FROM coupons
      ORDER BY created_at DESC, id DESC
    `
    )
    .all();

  return res.json({ coupons });
});

app.post("/api/admin/coupons", authRequired, adminRequired, (req, res) => {
  const { error, payload } = parseCouponPayload(req.body, true);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const existingCode = db
    .prepare("SELECT id FROM coupons WHERE UPPER(code) = UPPER(?)")
    .get(payload.code);
  if (existingCode) {
    return res.status(409).json({ message: "Coupon code already exists." });
  }

  const result = db
    .prepare(
      `
      INSERT INTO coupons (
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        is_active,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      payload.code,
      payload.description ?? null,
      payload.discountType,
      payload.discountValue,
      payload.minOrderAmount ?? 0,
      payload.isActive ?? 1,
      payload.expiresAt ?? null
    );

  const coupon = fetchCouponById(Number(result.lastInsertRowid));
  return res.status(201).json({ coupon });
});

app.patch("/api/admin/coupons/:id", authRequired, adminRequired, (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isInteger(couponId) || couponId < 1) {
    return res.status(400).json({ message: "Invalid coupon id." });
  }

  const existing = fetchCouponById(couponId);
  if (!existing) {
    return res.status(404).json({ message: "Coupon not found." });
  }

  const { error, payload } = parseCouponPayload(req.body, false);
  if (error) {
    return res.status(400).json({ message: error });
  }

  if (payload.code) {
    const sameCode = db
      .prepare("SELECT id FROM coupons WHERE UPPER(code) = UPPER(?) AND id != ?")
      .get(payload.code, couponId);
    if (sameCode) {
      return res.status(409).json({ message: "Coupon code already exists." });
    }
  }

  const finalType = payload.discountType || existing.discountType;
  const finalValue =
    payload.discountValue !== undefined ? payload.discountValue : existing.discountValue;
  if (finalType === "percent" && Number(finalValue) > 100) {
    return res.status(400).json({ message: "Percent discount cannot exceed 100." });
  }

  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return res.status(400).json({ message: "No valid fields supplied for update." });
  }

  const setClause = entries
    .map(([field]) => `${couponFieldToColumn[field]} = ?`)
    .join(", ");
  const values = entries.map(([, value]) => value);
  db.prepare(`UPDATE coupons SET ${setClause} WHERE id = ?`).run(...values, couponId);

  const coupon = fetchCouponById(couponId);
  return res.json({ coupon });
});

app.delete("/api/admin/coupons/:id", authRequired, adminRequired, (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isInteger(couponId) || couponId < 1) {
    return res.status(400).json({ message: "Invalid coupon id." });
  }

  const coupon = fetchCouponById(couponId);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found." });
  }

  const usedByOrders = db
    .prepare("SELECT COUNT(*) AS count FROM orders WHERE UPPER(coupon_code) = UPPER(?)")
    .get(coupon.code).count;
  if (usedByOrders > 0) {
    return res.status(409).json({ message: "Coupon has been used and cannot be deleted." });
  }

  db.prepare("DELETE FROM coupons WHERE id = ?").run(couponId);
  return res.json({ success: true });
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
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.discount_amount AS discountAmount,
        o.coupon_code AS couponCode,
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

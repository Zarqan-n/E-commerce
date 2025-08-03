import { users, products, orders, orderItems } from "@shared/schema";
import type { User, Product, Order, OrderItem, InsertUser, InsertProduct, InsertOrder, InsertOrderItem, CartItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategoryName(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // OrderItem operations
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  
  // Analytics operations
  getRecentOrders(limit: number): Promise<Order[]>;
  getLowStockProducts(threshold: number): Promise<Product[]>;
  getRevenueStats(): Promise<{daily: any[], weekly: any[], monthly: any[]}>;
  getCategoryDistribution(): Promise<{category: string, count: number}[]>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  sessionStore: session.SessionStore;
  private userId: number;
  private productId: number;
  private orderId: number;
  private orderItemId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userId = 1;
    this.productId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with admin user - using working hash
    this.users.set(this.userId++, {
      id: 1,
      username: "admin",
      password: "71ba71cac006cbc4d6cf12ab561bb32401481d1e61f0c6e34d52427875e6de662667f92b3c3e20b3cce18a4a9025ef187b235cdd308b7f8b81259bc1c065e039.3a89c10bf3d940ceaef12405898f9add", // "admin123" - working hash
      email: "admin@shopelite.com",
      fullName: "Admin User",
      isAdmin: true,
      createdAt: new Date()
    });
    
    // Add some sample products
    this.initializeProducts();
  }

  private initializeProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Premium Headphones",
        description: "Superior sound quality for music lovers. Features active noise cancellation and 20 hour battery life.",
        price: 149.99,
        imageUrl: "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 23,
        sku: "HP-100-BK",
        featured: true,
      },
      {
        name: "Smartwatch Pro",
        description: "Track fitness and stay connected with this premium smartwatch. Features heart rate monitoring and GPS.",
        price: 299.99,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 15,
        sku: "SW-200-SL",
        featured: true,
      },
      {
        name: "Wireless Earbuds",
        description: "True wireless earbuds with crystal clear sound and 8 hour battery life. Perfect for workouts and daily use.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 42,
        sku: "EB-300-WH",
        featured: false,
      },
      {
        name: "Laptop Stand",
        description: "Ergonomic laptop stand that improves posture and provides better airflow. Adjustable height and angle.",
        price: 49.99,
        imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Accessories",
        inventory: 18,
        sku: "LS-400-AL",
        featured: false,
      },
      {
        name: "Mechanical Keyboard",
        description: "Premium mechanical keyboard with Cherry MX switches. Perfect for gaming and typing with satisfying tactile feedback.",
        price: 129.99,
        imageUrl: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Accessories",
        inventory: 12,
        sku: "KB-500-MX",
        featured: true,
      },
      {
        name: "Gaming Mouse",
        description: "High-precision gaming mouse with customizable RGB lighting and programmable buttons. 25,600 DPI sensor.",
        price: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Accessories",
        inventory: 31,
        sku: "GM-600-RGB",
        featured: false,
      }
    ];

    for (const productData of sampleProducts) {
      this.products.set(this.productId, {
        id: this.productId,
        ...productData,
        createdAt: new Date()
      });
      this.productId++;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userId,
      ...insertUser,
      createdAt: new Date()
    };
    this.users.set(this.userId, user);
    this.userId++;
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategoryName(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.featured);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.productId,
      ...insertProduct,
      createdAt: new Date()
    };
    this.products.set(this.productId, product);
    this.productId++;
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct: Product = {
      ...existingProduct,
      ...productUpdate
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.products.values()).filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const order: Order = {
      id: this.orderId,
      ...orderData,
      createdAt: new Date()
    };
    this.orders.set(this.orderId, order);

    // Create order items
    for (const itemData of items) {
      const orderItem: OrderItem = {
        id: this.orderItemId,
        ...itemData,
        orderId: this.orderId
      };
      this.orderItems.set(this.orderItemId, orderItem);
      this.orderItemId++;
    }

    this.orderId++;
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // OrderItem operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  // Analytics operations
  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getLowStockProducts(threshold: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.inventory <= threshold)
      .sort((a, b) => a.inventory - b.inventory);
  }

  async getRevenueStats(): Promise<{daily: any[], weekly: any[], monthly: any[]}> {
    // Mock data for development
    return {
      daily: [
        { date: '2024-01-01', revenue: 1250.50 },
        { date: '2024-01-02', revenue: 980.25 },
        { date: '2024-01-03', revenue: 1450.75 }
      ],
      weekly: [
        { week: 1, year: 2024, revenue: 8500.00 },
        { week: 2, year: 2024, revenue: 9200.50 },
        { week: 3, year: 2024, revenue: 7800.25 }
      ],
      monthly: [
        { month: 'Jan', month_num: 1, year: 2024, revenue: 35000.00 },
        { month: 'Feb', month_num: 2, year: 2024, revenue: 42000.50 },
        { month: 'Mar', month_num: 3, year: 2024, revenue: 38000.25 }
      ]
    };
  }

  async getCategoryDistribution(): Promise<{category: string, count: number}[]> {
    const categoryCounts = new Map<string, number>();
    
    for (const product of this.products.values()) {
      const count = categoryCounts.get(product.category) || 0;
      categoryCounts.set(product.category, count + 1);
    }
    
    return Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}

// Export MemStorage for development
export const storage = new MemStorage(); 
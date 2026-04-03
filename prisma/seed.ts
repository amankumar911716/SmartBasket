import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';

async function main() {
  console.log('🌱 Seeding database...');

  // Delete ALL old demo users
  const oldEmails = [
    'demo@smartbasket.com',
    'admin@smartbasket.com',
    'priya@example.com',
    'rahul@example.com',
    'anita@example.com',
    'vikram@example.com',
    'sneha@example.com',
    'amit@example.com',
    'manager@smartbasket.com',
    'user.smartbasket@gmail.com',
  ];

  for (const email of oldEmails) {
    try {
      const users = await db.user.findMany({ where: { email } });
      for (const user of users) {
        await db.user.delete({ where: { id: user.id } });
        console.log(`🗑️  Deleted old user: ${email} (role: ${user.role})`);
      }
    } catch {
      console.log(`⚠️  User ${email} not found, skipping`);
    }
  }

  // Create categories
  const categories = await Promise.all([
    db.category.upsert({ where: { slug: 'fruits' }, update: {}, create: { name: 'Fruits', slug: 'fruits', image: '/cat-fruits.png', description: 'Fresh seasonal fruits delivered to your doorstep', sortOrder: 1, isActive: true } }),
    db.category.upsert({ where: { slug: 'vegetables' }, update: {}, create: { name: 'Vegetables', slug: 'vegetables', image: '/cat-vegetables.png', description: 'Farm fresh organic vegetables', sortOrder: 2, isActive: true } }),
    db.category.upsert({ where: { slug: 'dairy' }, update: {}, create: { name: 'Dairy & Breakfast', slug: 'dairy', image: '/cat-dairy.png', description: 'Milk, curd, eggs and breakfast essentials', sortOrder: 3, isActive: true } }),
    db.category.upsert({ where: { slug: 'snacks' }, update: {}, create: { name: 'Snacks & Beverages', slug: 'snacks', image: '/cat-snacks.png', description: 'Chips, biscuits, namkeen and cold drinks', sortOrder: 4, isActive: true } }),
    db.category.upsert({ where: { slug: 'dry-fruits' }, update: {}, create: { name: 'Dry Fruits', slug: 'dry-fruits', image: '/cat-dryfruits.png', description: 'Premium quality nuts and dry fruits', sortOrder: 5, isActive: true } }),
    db.category.upsert({ where: { slug: 'household' }, update: {}, create: { name: 'Household', slug: 'household', image: '/cat-household.png', description: 'Cleaning supplies and household essentials', sortOrder: 6, isActive: true } }),
    db.category.upsert({ where: { slug: 'personal-care' }, update: {}, create: { name: 'Personal Care', slug: 'personal-care', image: '/cat-personal.png', description: 'Skincare, haircare and personal hygiene', sortOrder: 7, isActive: true } }),
    db.category.upsert({ where: { slug: 'staples' }, update: {}, create: { name: 'Staples', slug: 'staples', image: '', description: 'Rice, wheat, flour, pulses and cooking essentials', sortOrder: 8, isActive: true } }),
  ]);

  const catMap: Record<string, string> = {};
  categories.forEach((c) => { catMap[c.slug] = c.id; });

  // Products data
  const products = [
    // Fruits
    { name: 'Banana', slug: 'banana', desc: 'Fresh ripe bananas, rich in potassium and vitamins. Perfect as a healthy snack or for smoothies.', price: 40, mrp: 50, unit: '1 dozen', cat: 'fruits', img: '/products/banana.png', brand: 'Fresh Farms', rating: 4.5, reviews: 128, featured: true, stock: 200 },
    { name: 'Apple (Shimla)', slug: 'apple-shimla', desc: 'Crisp and juicy Shimla apples. Sweet and perfect for daily consumption.', price: 180, mrp: 220, unit: '1 kg', cat: 'fruits', img: '/products/apple-shimla.png', brand: 'Fresh Farms', rating: 4.3, reviews: 95, featured: true, stock: 150 },
    { name: 'Mango (Alphonso)', slug: 'mango-alphonso', desc: 'Premium Alphonso mangoes from Ratnagiri. The king of mangoes with rich creamy texture.', price: 450, mrp: 550, unit: '1 dozen', cat: 'fruits', img: '/products/mango-alphonso.png', brand: 'Ratnagiri Farms', rating: 4.8, reviews: 256, featured: true, stock: 50 },
    { name: 'Orange (Nagpur)', slug: 'orange-nagpur', desc: 'Sweet and tangy Nagpur oranges. Rich in Vitamin C, perfect for fresh juice.', price: 80, mrp: 100, unit: '1 kg', cat: 'fruits', img: '/products/orange-nagpur.png', brand: 'Nagpur Gardens', rating: 4.2, reviews: 78, featured: false, stock: 180 },
    { name: 'Watermelon', slug: 'watermelon', desc: 'Fresh and juicy watermelon. Cool and refreshing for hot summer days.', price: 35, mrp: 45, unit: '1 pc (2-3kg)', cat: 'fruits', img: '/products/watermelon.png', brand: 'Fresh Farms', rating: 4.1, reviews: 64, featured: false, stock: 100 },
    { name: 'Grapes (Green)', slug: 'grapes-green', desc: 'Sweet seedless green grapes. Crisp and refreshing snack for all ages.', price: 90, mrp: 120, unit: '500 gm', cat: 'fruits', img: '/products/grapes-green.png', brand: 'Nashik Valley', rating: 4.4, reviews: 89, featured: false, stock: 120 },

    // Vegetables
    { name: 'Tomato', slug: 'tomato', desc: 'Fresh red tomatoes, perfect for curries, salads, and sauces.', price: 30, mrp: 40, unit: '1 kg', cat: 'vegetables', img: '/products/tomato.png', brand: 'Farm Fresh', rating: 4.0, reviews: 156, featured: true, stock: 300 },
    { name: 'Onion', slug: 'onion', desc: 'Premium quality onions. Essential for every Indian kitchen.', price: 35, mrp: 45, unit: '1 kg', cat: 'vegetables', img: '/products/onion.png', brand: 'Farm Fresh', rating: 4.1, reviews: 203, featured: true, stock: 400 },
    { name: 'Potato', slug: 'potato', desc: 'Fresh potatoes, versatile for frying, boiling, mashing, and curries.', price: 25, mrp: 35, unit: '1 kg', cat: 'vegetables', img: '/products/potato.png', brand: 'Farm Fresh', rating: 4.2, reviews: 178, featured: false, stock: 350 },
    { name: 'Spinach (Palak)', slug: 'spinach', desc: 'Fresh green spinach leaves. Rich in iron and nutrients.', price: 30, mrp: 40, unit: '250 gm', cat: 'vegetables', img: '/products/spinach.png', brand: 'Organic Farms', rating: 4.3, reviews: 67, featured: false, stock: 150 },
    { name: 'Capsicum (Green)', slug: 'capsicum-green', desc: 'Fresh green capsicum. Great for stir-fry, salads, and pizza toppings.', price: 35, mrp: 45, unit: '250 gm', cat: 'vegetables', img: '/products/capsicum-green.png', brand: 'Farm Fresh', rating: 4.1, reviews: 54, featured: false, stock: 200 },
    { name: 'Carrot', slug: 'carrot', desc: 'Fresh orange carrots. Crunchy and sweet, perfect for salads and halwa.', price: 40, mrp: 50, unit: '500 gm', cat: 'vegetables', img: '/products/carrot.png', brand: 'Farm Fresh', rating: 4.2, reviews: 72, featured: false, stock: 180 },

    // Dairy & Breakfast
    { name: 'Full Cream Milk', slug: 'full-cream-milk', desc: 'Fresh full cream milk. Rich and creamy, perfect for tea, coffee, and desserts.', price: 68, mrp: 72, unit: '1 L', cat: 'dairy', img: '/products/full-cream-milk.png', brand: 'Amul', rating: 4.6, reviews: 312, featured: true, stock: 500 },
    { name: 'Curd (Dahi)', slug: 'curd', desc: 'Thick and creamy curd. Set from fresh milk, perfect with meals.', price: 45, mrp: 50, unit: '400 gm', cat: 'dairy', img: '/products/curd.png', brand: 'Amul', rating: 4.5, reviews: 198, featured: true, stock: 300 },
    { name: 'Eggs (Farm Fresh)', slug: 'eggs', desc: 'Farm fresh white eggs. Protein-rich and perfect for breakfast.', price: 85, mrp: 95, unit: '12 pcs', cat: 'dairy', img: '/products/eggs.png', brand: 'Fresh Farms', rating: 4.4, reviews: 245, featured: false, stock: 400 },
    { name: 'Paneer', slug: 'paneer', desc: 'Soft and fresh paneer. Made from pure cow milk, perfect for curries.', price: 120, mrp: 140, unit: '200 gm', cat: 'dairy', img: '/products/paneer.png', brand: 'Amul', rating: 4.5, reviews: 167, featured: true, stock: 200 },
    { name: 'Butter (Unsalted)', slug: 'butter', desc: 'Pure unsalted butter. Made from fresh cream, great for cooking and baking.', price: 56, mrp: 58, unit: '100 gm', cat: 'dairy', img: '/products/butter.png', brand: 'Amul', rating: 4.7, reviews: 289, featured: false, stock: 250 },

    // Snacks & Beverages
    { name: 'Lays Classic Salted', slug: 'lays-classic', desc: 'Classic salted potato chips. The perfect crispy snack for any time.', price: 20, mrp: 20, unit: '52 gm', cat: 'snacks', img: '/products/lays-classic.png', brand: 'Lays', rating: 4.2, reviews: 456, featured: true, stock: 600 },
    { name: 'Parle-G Biscuits', slug: 'parle-g', desc: "India's favorite glucose biscuits. Perfect with tea and for all ages.", price: 10, mrp: 10, unit: '100 gm', cat: 'snacks', img: '/products/parle-g.png', brand: 'Parle', rating: 4.6, reviews: 876, featured: true, stock: 800 },
    { name: 'Haldiram Aloo Bhujia', slug: 'aloo-bhujia', desc: 'Crunchy aloo bhujia. Classic Indian namkeen perfect for snacking.', price: 55, mrp: 60, unit: '200 gm', cat: 'snacks', img: '/products/aloo-bhujia.png', brand: 'Haldiram', rating: 4.3, reviews: 234, featured: false, stock: 400 },
    { name: 'Coca-Cola', slug: 'coca-cola', desc: 'Refreshing Coca-Cola. The original taste that refreshes you instantly.', price: 40, mrp: 40, unit: '750 ml', cat: 'snacks', img: '/products/coca-cola.png', brand: 'Coca-Cola', rating: 4.4, reviews: 567, featured: false, stock: 500 },
    { name: 'Maggi Noodles', slug: 'maggi-noodles', desc: "India's favorite 2-minute noodles. Quick and delicious meal.", price: 14, mrp: 14, unit: '70 gm', cat: 'snacks', img: '/products/maggi-noodles.png', brand: 'Nestle', rating: 4.5, reviews: 923, featured: true, stock: 1000 },

    // Dry Fruits
    { name: 'Almonds (California)', slug: 'almonds', desc: 'Premium California almonds. Rich in healthy fats, protein, and vitamin E.', price: 550, mrp: 650, unit: '250 gm', cat: 'dry-fruits', img: '/products/almonds.png', brand: 'NutriBite', rating: 4.6, reviews: 178, featured: true, stock: 100 },
    { name: 'Cashew Nuts (W240)', slug: 'cashew-w240', desc: 'Premium whole cashew nuts W240 grade. Perfect for snacking and cooking.', price: 600, mrp: 720, unit: '250 gm', cat: 'dry-fruits', img: '/products/cashew-w240.png', brand: 'NutriBite', rating: 4.7, reviews: 145, featured: true, stock: 80 },
    { name: 'Raisins (Kishmish)', slug: 'raisins', desc: 'Sweet and juicy green raisins. Great for desserts and snacking.', price: 180, mrp: 220, unit: '250 gm', cat: 'dry-fruits', img: '/products/raisins.png', brand: 'NutriBite', rating: 4.3, reviews: 98, featured: false, stock: 150 },
    { name: 'Pistachios', slug: 'pistachios', desc: 'Premium roasted and salted pistachios. Crispy and delicious.', price: 700, mrp: 850, unit: '200 gm', cat: 'dry-fruits', img: '/products/pistachios.png', brand: 'NutriBite', rating: 4.8, reviews: 112, featured: false, stock: 60 },

    // Household
    { name: 'Surf Excel Matic', slug: 'surf-excel', desc: 'Front load washing machine detergent. Removes tough stains easily.', price: 350, mrp: 399, unit: '2 kg', cat: 'household', img: '/products/surf-excel.png', brand: 'Surf Excel', rating: 4.4, reviews: 234, featured: true, stock: 200 },
    { name: 'Vim Dishwash Gel', slug: 'vim-dishwash', desc: 'Lemon scented dishwash gel. Cuts through grease effectively.', price: 99, mrp: 110, unit: '500 ml', cat: 'household', img: '/products/vim-dishwash.png', brand: 'Vim', rating: 4.2, reviews: 189, featured: false, stock: 300 },
    { name: 'Harpic Toilet Cleaner', slug: 'harpic', desc: 'Original toilet cleaner. Kills 99.9% germs and removes stains.', price: 120, mrp: 135, unit: '1 L', cat: 'household', img: '/products/harpic.png', brand: 'Harpic', rating: 4.3, reviews: 167, featured: false, stock: 250 },

    // Personal Care
    { name: 'Dove Body Wash', slug: 'dove-body-wash', desc: 'Moisturizing body wash with 1/4th moisturizing cream. Soft and smooth skin.', price: 199, mrp: 225, unit: '250 ml', cat: 'personal-care', img: '/products/dove-body-wash.png', brand: 'Dove', rating: 4.5, reviews: 345, featured: true, stock: 200 },
    { name: 'Colgate MaxFresh', slug: 'colgate-maxfresh', desc: 'Fresh breath toothpaste with cooling crystals. Complete oral care.', price: 99, mrp: 105, unit: '150 gm', cat: 'personal-care', img: '/products/colgate-maxfresh.png', brand: 'Colgate', rating: 4.3, reviews: 278, featured: false, stock: 350 },
    { name: 'Head & Shoulders Shampoo', slug: 'h&s-shampoo', desc: 'Anti-dandruff shampoo. Clean and dandruff-free hair guaranteed.', price: 190, mrp: 210, unit: '340 ml', cat: 'personal-care', img: '/products/h-s-shampoo.png', brand: 'Head & Shoulders', rating: 4.4, reviews: 234, featured: false, stock: 250 },

    // Staples
    { name: 'Basmati Rice (India Gate)', slug: 'basmati-rice', desc: 'Premium aged basmati rice. Extra long grain with aromatic fragrance.', price: 185, mrp: 210, unit: '1 kg', cat: 'staples', img: '/products/basmati-rice.png', brand: 'India Gate', rating: 4.7, reviews: 456, featured: true, stock: 400 },
    { name: 'Toor Dal', slug: 'toor-dal', desc: 'Premium quality toor dal. Essential for sambar and dal tadka.', price: 155, mrp: 180, unit: '1 kg', cat: 'staples', img: '/products/toor-dal.png', brand: 'Tata Sampann', rating: 4.4, reviews: 312, featured: false, stock: 350 },
    { name: 'Atta (Whole Wheat)', slug: 'atta', desc: '100% whole wheat atta. Soft rotis every time, made from finest wheat.', price: 45, mrp: 52, unit: '1 kg', cat: 'staples', img: '/products/atta.png', brand: 'Aashirvaad', rating: 4.6, reviews: 567, featured: true, stock: 500 },
    { name: 'Refined Oil (Fortune)', slug: 'refined-oil', desc: 'Fortune sunflower refined oil. Light and healthy cooking oil.', price: 135, mrp: 155, unit: '1 L', cat: 'staples', img: '/products/refined-oil.png', brand: 'Fortune', rating: 4.3, reviews: 234, featured: false, stock: 300 },
    { name: 'Sugar', slug: 'sugar', desc: 'Refined white sugar. Pure and fine quality for daily use.', price: 45, mrp: 48, unit: '1 kg', cat: 'staples', img: '/products/sugar.png', brand: 'Madhur', rating: 4.1, reviews: 189, featured: false, stock: 600 },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        categoryId: catMap[p.cat],
        image: p.img,
        inStock: true,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviews,
        featured: p.featured,
        brand: p.brand,
      },
    });
  }

  // Create admin account with email cswithaman91@gmail.com
  const adminPassword = hashPassword('Admin@2026');
  const sharedEmail = 'cswithaman91@gmail.com';
  const sharedPhone = '+91 91171 96506';
  const sharedAddress = '98, 04, Noorsarai, Noorsarai';
  const sharedCity = 'BiharSharif';
  const sharedState = 'Nalanda';
  const sharedPincode = '803113';

  const adminUser = await db.user.upsert({
    where: { email_role: { email: sharedEmail, role: 'admin' } },
    update: {
      name: 'Admin (CS With Aman)',
      phone: sharedPhone,
      password: adminPassword,
      isActive: true,
    },
    create: {
      name: 'Admin (CS With Aman)',
      email: sharedEmail,
      phone: sharedPhone,
      role: 'admin',
      password: adminPassword,
      isActive: true,
    },
  });

  // Create user account with same email cswithaman91@gmail.com
  const userPassword = hashPassword('User@2026');

  const regularUser = await db.user.upsert({
    where: { email_role: { email: sharedEmail, role: 'user' } },
    update: {
      name: 'User (CS With Aman)',
      phone: sharedPhone,
      password: userPassword,
      isActive: true,
    },
    create: {
      name: 'User (CS With Aman)',
      email: sharedEmail,
      phone: sharedPhone,
      role: 'user',
      password: userPassword,
      isActive: true,
    },
  });

  console.log('✅ Created admin account: cswithaman91@gmail.com (role: admin, password: Admin@2026)');
  console.log('✅ Created user account: cswithaman91@gmail.com (role: user, password: User@2026)');

  // Create addresses for admin
  await db.address.upsert({
    where: { id: 'admin-address-1' },
    update: {
      userId: adminUser.id,
      fullName: 'Admin (CS With Aman)',
      address: sharedAddress,
      city: sharedCity,
      state: sharedState,
      pincode: sharedPincode,
      phone: sharedPhone,
    },
    create: {
      id: 'admin-address-1',
      userId: adminUser.id,
      label: 'Home',
      fullName: 'Admin (CS With Aman)',
      address: sharedAddress,
      city: sharedCity,
      state: sharedState,
      pincode: sharedPincode,
      phone: sharedPhone,
      isDefault: true,
    },
  });

  // Create addresses for regular user
  await db.address.upsert({
    where: { id: 'user-address-1' },
    update: {
      userId: regularUser.id,
      fullName: 'User (CS With Aman)',
      address: sharedAddress,
      city: sharedCity,
      state: sharedState,
      pincode: sharedPincode,
      phone: sharedPhone,
    },
    create: {
      id: 'user-address-1',
      userId: regularUser.id,
      label: 'Home',
      fullName: 'User (CS With Aman)',
      address: sharedAddress,
      city: sharedCity,
      state: sharedState,
      pincode: sharedPincode,
      phone: sharedPhone,
      isDefault: true,
    },
  });

  // Create coupons
  await db.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: { code: 'WELCOME20', discount: 20, type: 'percentage', minOrder: 500, maxUses: 1000, usedCount: 0, active: true },
  });
  await db.coupon.upsert({
    where: { code: 'FLAT50' },
    update: {},
    create: { code: 'FLAT50', discount: 50, type: 'flat', minOrder: 300, maxUses: 500, usedCount: 0, active: true },
  });
  await db.coupon.upsert({
    where: { code: 'SAVE100' },
    update: {},
    create: { code: 'SAVE100', discount: 100, type: 'flat', minOrder: 800, maxUses: 200, usedCount: 0, active: true },
  });

  // Create sample orders for regular user
  const sampleProducts = await db.product.findMany({ take: 3 });
  const orderTotal = sampleProducts.reduce((sum, p) => sum + p.price * 2, 0);

  await db.order.upsert({
    where: { id: 'demo-order-1' },
    update: {
      userId: regularUser.id,
      addressId: 'user-address-1',
    },
    create: {
      id: 'demo-order-1',
      orderId: 'SB-ORD-000001',
      userId: regularUser.id,
      addressId: 'user-address-1',
      items: JSON.stringify(sampleProducts.map(p => ({ productId: p.id, name: p.name, quantity: 2, price: p.price }))),
      total: orderTotal,
      discount: 0,
      deliveryFee: 0,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      deliverySlot: '9 AM - 12 PM',
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const order2Products = await db.product.findMany({ skip: 3, take: 4 });
  const order2Total = order2Products.reduce((sum, p) => sum + p.price, 0);

  await db.order.upsert({
    where: { id: 'demo-order-2' },
    update: {
      userId: regularUser.id,
      addressId: 'user-address-1',
    },
    create: {
      id: 'demo-order-2',
      orderId: 'SB-ORD-000002',
      userId: regularUser.id,
      addressId: 'user-address-1',
      items: JSON.stringify(order2Products.map(p => ({ productId: p.id, name: p.name, quantity: 1, price: p.price }))),
      total: order2Total,
      discount: 0,
      deliveryFee: 25,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'in_transit',
      deliverySlot: '2 PM - 5 PM',
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { db.$disconnect(); });

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A few sample images (Unsplash allows hotlinking).
const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
];

async function main() {
  // 1) Seller (idempotent by unique email)
  const seller = await prisma.sellers.upsert({
    where: { email: "seed.seller@example.com" },
    update: {},
    create: {
      email: "seed.seller@example.com",
      name: "Seed Seller",
      country: "India",
    },
  });

  // 2) Shop (sellerId is @unique → one shop per seller)
  const shop = await prisma.shops.upsert({
    where: { sellerId: seller.id },
    update: {},
    create: {
      name: "Seed Store",
      country: "India",
      bio: "A demo shop seeded for local development.",
      category: "Electronics",
      address: "123 Demo Street",
      sellerId: seller.id,
    },
  });

  // 3) Products (idempotent by unique slug). starting_date/ending_date left null
  //    so they pass getAllProducts' baseFilter and show on the home page.
  const products = [
    { title: "Wireless Headphones", category: "Electronics", subCategory: "Audio", sale_price: 79.99, regular_price: 129.99, stock: 25, totalSales: 42 },
    { title: "Smart Watch", category: "Electronics", subCategory: "Wearables", sale_price: 149.0, regular_price: 199.0, stock: 8, totalSales: 17 },
    { title: "Mechanical Keyboard", category: "Electronics", subCategory: "Accessories", sale_price: 59.5, regular_price: 89.0, stock: 40, totalSales: 63 },
    { title: "Desk Lamp", category: "Home", subCategory: "Lighting", sale_price: 24.99, regular_price: 34.99, stock: 3, totalSales: 9 },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const slug = p.title.toLowerCase().replace(/\s+/g, "-");

    await prisma.products.upsert({
      where: { slug },
      update: {},
      create: {
        title: p.title,
        slug,
        category: p.category,
        subCategory: p.subCategory,
        short_description: `${p.title} — great value, seeded for demo.`,
        detailed_description: `Full detailed description for ${p.title}.`,
        tags: [p.category.toLowerCase(), p.subCategory.toLowerCase()],
        stock: p.stock,
        sale_price: p.sale_price,
        regular_price: p.regular_price,
        totalSales: p.totalSales,
        brand: "Acme",
        colors: [],
        sizes: [],
        discount_codes: [],
        custom_specification: {},
        custom_properties: {},
        cashOnDelivery: "yes",
        shopId: shop.id,
        images: {
          create: {
            file_id: `seed-${i}`,
            url: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
          },
        },
      },
    });
  }

  const count = await prisma.products.count({ where: { shopId: shop.id } });
  console.log(`✅ Seed complete. Shop "${shop.name}" now has ${count} products.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

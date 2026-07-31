import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const initializeSiteConfig = async () => {
    try {
        const existingConfig = await prisma.site_config.findFirst();
        if (!existingConfig) {
            await prisma.site_config.create({
                data: {
                    categories: [
                        "Electronics",
                        "Fashion",
                        "Home & Kitchen",
                        "Sports & Fitness",
                    ],
                    subCategories: {
                        Electronics: [
                            "Mobile Phones",
                            "Laptops & Computers",
                            "Audio & Headphones",
                            "Cameras & Photography",
                            "Wearable Technology",
                            "Televisions & Home Audio",
                            "Gaming & Consoles",
                            "Computer Accessories",
                            "Smart Home Devices",
                        ],
                        Fashion: [
                            "Men's Clothing",
                            "Women's Clothing",
                            "Kids' Clothing",
                            "Footwear",
                            "Watches",
                            "Bags & Luggage",
                            "Eyewear & Sunglasses",
                            "Jewellery & Accessories",
                        ],
                        "Home & Kitchen": [
                            "Kitchenware & Dining",
                            "Home Decor & Vases",
                            "Bedding & Linens",
                            "Storage & Organization",
                            "Lighting & Lamps",
                            "Bathware & Accessories",
                            "Cleaning Supplies",
                        ],
                        "Sports & Fitness": [
                            "Fitness & Gym Equipment",
                            "Outdoor & Camping Gear",
                            "Team Sports Equipment",
                            "Racquet Sports",
                            "Cycling & Bicycles",
                            "Sportswear & Athletic Shoes",
                            "Water Sports",
                        ],
                    },
                },
            });
        }
    } catch (error) {
        console.error("Failed to initialize site config:", error);
    }
};



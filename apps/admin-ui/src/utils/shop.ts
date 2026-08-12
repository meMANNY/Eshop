/**
 * The Prisma relation on `products` is `Shop`, capitalised, and that is the key
 * the admin service selects. Reading only lowercase `shop` — as the product and
 * event pages did — meant the shop column and the shop-name search silently
 * matched nothing. Accepting both keeps the pages working whichever way the
 * service ends up naming it.
 */
export const shopOf = (row: any) => row?.Shop ?? row?.shop;

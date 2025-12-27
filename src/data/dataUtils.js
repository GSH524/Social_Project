// Data utilities to handle large datasets
import customersRaw from "./customers.js";
import ordersRaw from "./orders.js";
import orderItemsRaw from "./orderItems.js";
import orderReturnsRaw from "./orderReturns.js";
import productsRaw from "./product.js";

export const customers = customersRaw.slice(0,1000);
export const orders = ordersRaw.slice(0,1000);
export const orderItems = orderItemsRaw.slice(0,1000);
export const orderReturns = orderReturnsRaw.slice(0,1000);
export const products = productsRaw.slice(0,1000);
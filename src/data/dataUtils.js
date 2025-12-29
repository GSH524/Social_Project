// Data utilities to handle large datasets
import customersRaw from "./customers.js";
import ordersRaw from "./orders.js";
import orderItemsRaw from "./orderItems.js";
import orderReturnsRaw from "./orderReturns.js";
import productsRaw from "./product.js";

export const customers = customersRaw;
export const orders = ordersRaw;
export const orderItems = orderItemsRaw;
export const orderReturns = orderReturnsRaw;
export const products = productsRaw.slice(0,1000);
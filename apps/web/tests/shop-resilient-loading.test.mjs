import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app/shop/page.tsx',import.meta.url),'utf8');
test('Shop loads settings independently from product catalogue',()=>{
 assert.match(source,/settingsResult=await api<Settings>\("\/api\/v1\/commerce\/settings"\)/);
 assert.match(source,/productsResult=await api<Product\[]>\("\/api\/v1\/commerce\/products"\)/);
 assert.match(source,/Some shop information is temporarily unavailable/);
});
test('Shop keeps cart and order panels independently recoverable',()=>{
 assert.match(source,/cartResult,ordersResult/);
 assert.match(source,/setOrders\(ordersResult\.value\)/);
});

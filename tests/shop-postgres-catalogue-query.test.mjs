import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../apps/backend/src/main/java/com/jnapanam/sportszone/commerce/service/CommerceService.java', import.meta.url),
  'utf8'
);

test('public Shop catalogue does not bind an untyped null category to PostgreSQL', () => {
  assert.match(source, /if \(category == null \|\| category\.isBlank\(\)\)/);
  assert.match(source, /jdbc\.query\(sql \+ "order by p\.name", \(r, n\) -> product\(r\)\)/);
  assert.doesNotMatch(source, /and \(\? is null or upper\(c\.code\)=upper\(\?\)\)/i);
});

test('Shop category filter trims input and binds only one typed parameter', () => {
  assert.match(source, /upper\(c\.code\)=upper\(\?\) order by p\.name/);
  assert.match(source, /category\.trim\(\)/);
});

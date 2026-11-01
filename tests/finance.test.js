import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../src/lib/finance.js';

test('calcula totais financeiros com entradas, despesas, compras e reserva', () => {
  const result = summarize(
    [{type:'income',amount:1000},{type:'expense',amount:200}],
    [{amount:100,payment_source:'balance'},{amount:50,payment_source:'reserve'}],
    [{type:'deposit',amount:300},{type:'withdrawal',amount:25}]
  );
  assert.equal(result.income,1000);
  assert.equal(result.expenses,200);
  assert.equal(result.purchases,150);
  assert.equal(result.reserve,225);
  assert.equal(result.balance,425);
});

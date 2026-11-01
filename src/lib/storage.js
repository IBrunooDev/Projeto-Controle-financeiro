import { hasSupabaseConfig, supabase } from "./supabase";

const keys = {
  transactions: "valtrix.transactions",
  purchases: "valtrix.purchases",
  reserve: "valtrix.reserve",
  goals: "valtrix.goals",
  budgets: "valtrix.budgets",
  recurring: "valtrix.recurring"
};

const legacyKeys = {
  "valtrix.transactions": "finanly.transactions",
  "valtrix.purchases": "finanly.purchases",
  "valtrix.reserve": "finanly.reserve"
};

// Migra automaticamente os dados locais da Finanly para o Valtrix sem apagá-los.
const read = (key) => {
  try {
    let value = localStorage.getItem(key);
    if (value === null && legacyKeys[key]) {
      const legacyValue = localStorage.getItem(legacyKeys[key]);
      if (legacyValue !== null) {
        localStorage.setItem(key, legacyValue);
        value = legacyValue;
      }
    }
    return JSON.parse(value || "[]");
  } catch { return []; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const id = () => crypto.randomUUID();

export const localStore = {
  getAll: async () => ({
    transactions: read(keys.transactions),
    purchases: read(keys.purchases),
    reserveMoves: read(keys.reserve),
    goals: read(keys.goals), budgets: read(keys.budgets), recurring: read(keys.recurring)
  }),
  addTransaction: async (_userId, item) => {
    const all = read(keys.transactions);
    const created = { ...item, id: id(), created_at: new Date().toISOString() };
    write(keys.transactions, [created, ...all]);
    return created;
  },
  deleteTransaction: async (itemId) => write(keys.transactions, read(keys.transactions).filter(x => x.id !== itemId)),
  addPurchase: async (_userId, item) => {
    const all = read(keys.purchases);
    const created = { ...item, id: id(), created_at: new Date().toISOString() };
    write(keys.purchases, [created, ...all]);
    return created;
  },
  deletePurchase: async (itemId) => write(keys.purchases, read(keys.purchases).filter(x => x.id !== itemId)),
  addReserveMove: async (_userId, item) => {
    const all = read(keys.reserve);
    const created = { ...item, id: id(), created_at: new Date().toISOString() };
    write(keys.reserve, [created, ...all]);
    return created;
  },
  deleteReserveMove: async (itemId) => write(keys.reserve, read(keys.reserve).filter(x => x.id !== itemId)),
  addFeature: async (kind, item) => { const key = keys[kind]; const created = { ...item, id: id(), created_at: new Date().toISOString() }; write(key, [created, ...read(key)]); return created; },
  deleteFeature: async (kind, itemId) => write(keys[kind], read(keys[kind]).filter(x => x.id !== itemId)),
  updateFeature: async (kind, itemId, patch) => write(keys[kind], read(keys[kind]).map(x => x.id === itemId ? { ...x, ...patch } : x))
};

export const cloudStore = {
  getAll: async (userId) => {
    const [t, p, r] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("occurred_at", { ascending: false }),
      supabase.from("purchases").select("*").eq("user_id", userId).order("occurred_at", { ascending: false }),
      supabase.from("reserve_movements").select("*").eq("user_id", userId).order("occurred_at", { ascending: false })
    ]);
    for (const result of [t, p, r]) if (result.error) throw result.error;
    const [g,b,c] = await Promise.all([
      supabase.from("financial_goals").select("*").eq("user_id", userId).order("created_at", {ascending:false}),
      supabase.from("monthly_budgets").select("*").eq("user_id", userId).order("created_at", {ascending:false}),
      supabase.from("recurring_expenses").select("*").eq("user_id", userId).order("next_due", {ascending:true})
    ]);
    for (const result of [g,b,c]) if (result.error) throw result.error;
    return { transactions: t.data || [], purchases: p.data || [], reserveMoves: r.data || [], goals:g.data||[], budgets:b.data||[], recurring:c.data||[] };
  },
  addTransaction: async (userId, item) => {
    const { data, error } = await supabase.from("transactions").insert({ ...item, user_id: userId }).select().single();
    if (error) throw error; return data;
  },
  deleteTransaction: async (itemId, userId) => {
    const { error } = await supabase.from("transactions").delete().eq("id", itemId).eq("user_id", userId);
    if (error) throw error;
  },
  addPurchase: async (userId, item) => {
    // A tabela purchases usa "name" para o produto e não possui a coluna "description".
    const { description, ...purchase } = item;
    const { data, error } = await supabase.from("purchases").insert({ ...purchase, user_id: userId }).select().single();
    if (error) throw error; return data;
  },
  deletePurchase: async (itemId, userId) => {
    const { error } = await supabase.from("purchases").delete().eq("id", itemId).eq("user_id", userId);
    if (error) throw error;
  },
  addReserveMove: async (userId, item) => {
    const { data, error } = await supabase.from("reserve_movements").insert({ ...item, user_id: userId }).select().single();
    if (error) throw error; return data;
  },
  deleteReserveMove: async (itemId, userId) => {
    const { error } = await supabase.from("reserve_movements").delete().eq("id", itemId).eq("user_id", userId);
    if (error) throw error;
  },
  addFeature: async (kind, item, userId) => { const table={goals:"financial_goals",budgets:"monthly_budgets",recurring:"recurring_expenses"}[kind]; const {data,error}=await supabase.from(table).insert({...item,user_id:userId}).select().single(); if(error) throw error; return data; },
  deleteFeature: async (kind,itemId,userId) => { const table={goals:"financial_goals",budgets:"monthly_budgets",recurring:"recurring_expenses"}[kind]; const {error}=await supabase.from(table).delete().eq("id",itemId).eq("user_id",userId); if(error) throw error; },
  updateFeature: async (kind,itemId,patch,userId) => { const table={goals:"financial_goals",budgets:"monthly_budgets",recurring:"recurring_expenses"}[kind]; const {error}=await supabase.from(table).update(patch).eq("id",itemId).eq("user_id",userId); if(error) throw error; }
};

export const store = hasSupabaseConfig ? cloudStore : localStore;

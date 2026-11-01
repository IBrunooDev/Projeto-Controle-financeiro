import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const encoder = new TextEncoder();
async function hashCode(code: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 150000, hash: "SHA-256" }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomSalt() { const bytes = crypto.getRandomValues(new Uint8Array(16)); return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, message: "Método não permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  try {
    const body = await req.json();
    if (body.action === "set") {
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) return json({ success: false, message: "Entre na sua conta para configurar o código." }, 401);
      const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (authError || !user?.id || !user.email) return json({ success: false, message: "Sessão inválida. Entre novamente." }, 401);
      const code = String(body.code || "");
      if (!/^\d{6}$/.test(code)) return json({ success: false, message: "O código precisa ter 6 números." }, 400);
      const salt = randomSalt();
      const code_hash = await hashCode(code, salt);
      const { error } = await admin.from("password_recovery_codes").upsert({ user_id: user.id, email: user.email.toLowerCase(), code_hash, salt, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      return json({ success: true });
    }
    if (body.action === "recover") {
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "");
      const newPassword = String(body.newPassword || "");
      if (!email || !/^\d{6}$/.test(code) || newPassword.length < 6 || newPassword.length > 128) return json({ success: false, message: "Confira o e-mail, o código de 6 números e a nova senha (mínimo 6 caracteres)." }, 400);
      const { data: allowed, error: rateError } = await admin.rpc("check_password_recovery_attempt", { p_email: email });
      if (rateError) throw rateError;
      if (!allowed) return json({ success: false, message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." }, 429);
      const { data: record, error } = await admin.from("password_recovery_codes").select("user_id,code_hash,salt").eq("email", email).maybeSingle();
      if (error) throw error;
      if (!record || await hashCode(code, record.salt) !== record.code_hash) return json({ success: false, message: "E-mail ou código de recuperação incorretos." }, 400);
      const { error: updateError } = await admin.auth.admin.updateUserById(record.user_id, { password: newPassword });
      if (updateError) throw updateError;
      await admin.from("password_recovery_attempts").delete().eq("email", email);
      return json({ success: true });
    }
    return json({ success: false, message: "Ação inválida." }, 400);
  } catch (error) {
    console.error("password-recovery-code:", error);
    return json({ success: false, message: "Não foi possível concluir a operação. Verifique a configuração da função no Supabase." }, 500);
  }
});

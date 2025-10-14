# 🤖 Setup: Telegram Bot con Vercel Cron

## 🎯 ¿Qué hace esto?

Cada día a las **8 PM** recibirás en Telegram un mensaje con **10 frases aleatorias** de tu base de datos.

---

## 📝 Pasos para Configurar

### Paso 1: Crear Telegram Bot (2 minutos)

1. **Abre Telegram** en tu celular o desktop

2. **Busca:** `@BotFather`

3. **Envía:** `/newbot`

4. **Sigue las instrucciones:**
   - Te preguntará el nombre: `What's Funny Bot`
   - Te preguntará el username: `whatsfunnybot` (o el que quieras que termine en `bot`)

5. **Copia el TOKEN** que te da BotFather
   - Se ve así: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

---

### Paso 2: Obtener tu Chat ID (1 minuto)

**Opción A - Usando @userinfobot:**
1. Busca: `@userinfobot` en Telegram
2. Envía cualquier mensaje
3. Te responderá con tu ID
4. Copia el número (ejemplo: `123456789`)

**Opción B - Manualmente:**
1. Envía un mensaje a tu bot (el que creaste)
2. Abre en tu navegador:
   ```
   https://api.telegram.org/bot[TU_TOKEN]/getUpdates
   ```
   (Reemplaza `[TU_TOKEN]` con el token que te dio BotFather)
3. Busca `"chat":{"id":` y copia el número

---

### Paso 3: Configurar en Vercel (1 minuto)

1. **Ve a tu proyecto en Vercel:**
   - https://vercel.com/mauriciobrauer/whatsfunny

2. **Settings → Environment Variables**

3. **Agrega estas 2 variables:**

**Variable 1:**
```
Name:  TELEGRAM_BOT_TOKEN
Value: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Variable 2:**
```
Name:  TELEGRAM_CHAT_ID
Value: 123456789
```

4. **Click "Save"**

5. **Redeploy:**
   - Ve a "Deployments"
   - Click en los 3 puntos del último deployment
   - Click "Redeploy"

---

### Paso 4: Habilitar Cron en Vercel (1 minuto)

1. **Ve a tu proyecto en Vercel**

2. **Settings → Cron Jobs**

3. Deberías ver:
   ```
   Path: /api/cron/send-daily-phrases
   Schedule: 0 20 * * * (8 PM todos los días)
   ```

4. **IMPORTANTE:** Los Cron Jobs **requieren Vercel Pro** ($20/mes)
   - Si no tienes Pro, puedes:
     - Actualizar a Pro
     - Usar GitHub Actions (gratis)

---

## 🧪 Probar Manualmente (Antes de las 8 PM)

Para probar que funciona SIN esperar a las 8 PM:

**Opción 1 - Desde el navegador:**
```
https://whatsfunny-tau.vercel.app/api/cron/send-daily-phrases
```

**Opción 2 - Desde terminal:**
```bash
curl https://whatsfunny-tau.vercel.app/api/cron/send-daily-phrases
```

Si funciona, recibirás un mensaje en Telegram con 10 frases.

---

## 📱 Formato del Mensaje en Telegram

```
😄 Daily Funny Phrases

1. Sindrome del espermatozoide vencido

2. La kechup - Armela

3. No hace falta divertirse para tomar alcohol

...

10. Que tal las salsas

---
From What's funny?
```

---

## ⚠️ Importante: Vercel Cron Requiere Plan Pro

**Vercel Free Tier:**
- ❌ No incluye Cron Jobs

**Vercel Pro ($20/mes):**
- ✅ Incluye Cron Jobs ilimitados

---

## 🆓 Alternativa GRATIS: GitHub Actions

Si prefieres no pagar, puedo implementarlo con **GitHub Actions** que es:
- ✅ 100% Gratis
- ✅ Igual de confiable
- ✅ Un archivo extra de configuración

**¿Quieres que cambie a GitHub Actions en lugar de Vercel Cron?**

---

## 🎯 Resumen

**YO:** ✅ Código del endpoint listo  
**YO:** ✅ vercel.json configurado  
**TÚ:** Crear bot de Telegram  
**TÚ:** Agregar variables en Vercel  
**TÚ:** Actualizar a Vercel Pro (o usar GitHub Actions)  

**¿Seguimos con Vercel Cron o cambiamos a GitHub Actions (gratis)?**


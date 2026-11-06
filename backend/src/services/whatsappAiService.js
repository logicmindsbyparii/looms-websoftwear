import { Machine } from '../models/Machine.js';
import { ProductionLog } from '../models/ProductionLog.js';
import { Stock } from '../models/Stock.js';
import { Worker } from '../models/Worker.js';
import { Alarm } from '../models/Alarm.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Settings } from '../models/Settings.js';
import { logger } from '../utils/logger.js';

/**
 * Detect language of incoming query
 */
export function detectLanguage(text = '') {
  const t = text.toLowerCase();
  // Gujarati script or romanized Gujarati keywords
  if (/[\u0A80-\u0AFF]/.test(text) || /\b(ketlu|ketla|aaje|bandh|utpadan|karyakshamta|mal|kari|che|chhe)\b/i.test(t)) {
    return 'gu';
  }
  // Hindi script or romanized Hindi keywords
  if (/[\u0900-\u097F]/.test(text) || /\b(kitna|kitne|aaj|band|karein|hai|hain|hoga|batao|kiska|sabse|kam)\b/i.test(t)) {
    return 'hi';
  }
  return 'en';
}

/**
 * AI Assistant Query Processor
 * Classifies intent and queries live MongoDB database collections
 */
export async function processAiQuery(queryText = '') {
  const lang = detectLanguage(queryText);
  const q = queryText.toLowerCase().trim();

  // Guard against prompt injection or malicious input
  if (q.length > 300 || /system prompt|ignore previous|drop database|eval\(|<script/i.test(q)) {
    if (lang === 'gu') return `⚠️ ક્ષમા કરશો, હું માત્ર LOOMUS ટેક્સટાઇલ ફેક્ટરીના પ્રશ્નોના ઉત્તર આપી શકું છું.`;
    if (lang === 'hi') return `⚠️ क्षमा करें, मैं केवल LOOMUS टेक्सटाइल फैक्ट्री संचालन के सवालों का उत्तर दे सकता हूँ।`;
    return `⚠️ Security Notice: I can only answer operational queries related to LOOMUS Textile Mill data.`;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    // 1. TODAY'S PRODUCTION QUERY ("Aaj kitna production hua?", "આજે કેટલું ઉત્પાદન થયું?")
    if (
      q.includes('production') ||
      q.includes('utpadan') ||
      q.includes('kitna prod') ||
      q.includes('ketlu') ||
      q.includes('meters') ||
      q.includes('meter') ||
      q.includes('output')
    ) {
      const todayLogs = await ProductionLog.find({ createdAt: { $gte: todayStart, $lte: todayEnd } });
      const machines = await Machine.find();
      const totalMeters = todayLogs.reduce((acc, l) => acc + (Number(l.output) || 0), 0);
      const targetMeters = machines.length * 75;
      const pct = targetMeters > 0 ? ((totalMeters / targetMeters) * 100).toFixed(1) : 0;
      const runningCount = machines.filter(m => m.status === 'running').length;

      if (lang === 'gu') {
        return `📊 *LOOMUS AI ફેક્ટરી અપડેટ — આજનું ઉત્પાદન*
----------------------------------------
🧵 *કુલ ઉત્પાદન:* *${totalMeters.toLocaleString()} મીટર*
🎯 *આજનો લક્ષ્યાંક:* *${targetMeters.toLocaleString()} મીટર* (${pct}%)
🟢 *ચાલુ લૂમ્સ:* *${runningCount} / ${machines.length}*
----------------------------------------
✅ ડેટાબેઝમાંથી લાઇવ ગણતરી`;
      }

      if (lang === 'hi') {
        return `📊 *LOOMUS AI फैक्ट्री अपडेट — आज का उत्पादन*
----------------------------------------
🧵 *कुल उत्पादन:* *${totalMeters.toLocaleString()} मीटर*
🎯 *आज का टारगेट:* *${targetMeters.toLocaleString()} मीटर* (${pct}%)
🟢 *चालू लूम:* *${runningCount} / ${machines.length}*
----------------------------------------
✅ डेटाबेस से लाइव गणना`;
      }

      return `📊 *LOOMUS AI Factory Update — Today's Production*
----------------------------------------
🧵 *Total Output:* *${totalMeters.toLocaleString()} meters*
🎯 *Daily Target:* *${targetMeters.toLocaleString()} meters* (${pct}%)
🟢 *Running Looms:* *${runningCount} of ${machines.length} active*
----------------------------------------
✅ Real-time verified database calculation`;
    }

    // 2. STOPPED / RUNNING LOOMS QUERY ("Kitne loom band hain?", "કેટલા લૂમ બંધ છે?")
    if (
      q.includes('band') ||
      q.includes('stopped') ||
      q.includes('chalu') ||
      q.includes('running') ||
      q.includes('idle') ||
      q.includes('status')
    ) {
      const machines = await Machine.find();
      const running = machines.filter(m => m.status === 'running');
      const stopped = machines.filter(m => m.status === 'stopped');
      const maintenance = machines.filter(m => m.status === 'maintenance');
      const idle = machines.filter(m => m.status === 'idle');

      const stoppedList = stopped.map(m => m.id).join(', ') || (lang === 'gu' ? 'કોઈ નહીં' : lang === 'hi' ? 'कोई नहीं' : 'None');

      if (lang === 'gu') {
        return `⚙️ *LOOMUS લૂમ સ્થિતિ (લાઈવ)*
----------------------------------------
🟢 *ચાલુ (Running):* *${running.length} લૂમ્સ*
🔴 *બંધ (Stopped):* *${stopped.length} લૂમ્સ*
🟡 *આઇડલ (Idle):* *${idle.length}*
🔧 *મેન્ટેનન્સ:* *${maintenance.length}*
----------------------------------------
⚠️ *બંધ લૂમ્સના ID:* ${stoppedList}
----------------------------------------
✅ LOOMUS AI લાઇવ ટેલિમેટ્રી`;
      }

      if (lang === 'hi') {
        return `⚙️ *LOOMUS लूम स्थिति (लाइव)*
----------------------------------------
🟢 *चालू (Running):* *${running.length} लूम*
🔴 *बंद (Stopped):* *${stopped.length} लूम*
🟡 *आइडल (Idle):* *${idle.length}*
🔧 *मेंटेनेंस:* *${maintenance.length}*
----------------------------------------
⚠️ *बंद लूम की लिस्ट:* ${stoppedList}
----------------------------------------
✅ LOOMUS AI लाइव टेलीमेट्री`;
      }

      return `⚙️ *LOOMUS Loom Status (Live)*
----------------------------------------
🟢 *Running:* *${running.length} looms*
🔴 *Stopped:* *${stopped.length} looms*
🟡 *Idle:* *${idle.length} looms*
🔧 *Maintenance:* *${maintenance.length} looms*
----------------------------------------
⚠️ *Stopped Loom IDs:* ${stoppedList}
----------------------------------------
✅ Verified via LOOMUS Live Telemetry`;
    }

    // 3. LOWEST / HIGHEST EFFICIENCY QUERY ("Which loom has the lowest efficiency?")
    if (
      q.includes('efficiency') ||
      q.includes('karyakshamta') ||
      q.includes('lowest') ||
      q.includes('highest') ||
      q.includes('kam') ||
      q.includes('ochi')
    ) {
      const machines = await Machine.find();
      if (machines.length === 0) return 'No machines found in database.';

      const sorted = [...machines].sort((a, b) => (a.efficiency || 0) - (b.efficiency || 0));
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];
      const avg = (machines.reduce((acc, m) => acc + (Number(m.efficiency) || 0), 0) / machines.length).toFixed(1);

      if (lang === 'gu') {
        return `⚡ *LOOMUS AI લૂમ કાર્યક્ષમતા વિશ્લેષણ*
----------------------------------------
📈 *સરેરાશ કાર્યક્ષમતા:* *${avg}%*
🔻 *સૌથી ઓછી કાર્યક્ષમતા:* *${lowest.id}* (*${lowest.efficiency}%* • સ્થિતિ: ${lowest.status.toUpperCase()})
   કાપડ: ${lowest.fabric} | RPM: ${lowest.rpm}
🥇 *સૌથી વધુ કાર્યક્ષમતા:* *${highest.id}* (*${highest.efficiency}%* • ${highest.fabric})
----------------------------------------
💡 મિકેનિકને ${lowest.id} ચેક કરવા સૂચન કરવામાં આવે છે.`;
      }

      if (lang === 'hi') {
        return `⚡ *LOOMUS AI लूम दक्षता विश्लेषण*
----------------------------------------
📈 *औसत एफिशिएंसी:* *${avg}%*
🔻 *सबसे कम एफिशिएंसी:* *${lowest.id}* (*${lowest.efficiency}%* • स्थिति: ${lowest.status.toUpperCase()})
   कपड़ा: ${lowest.fabric} | RPM: ${lowest.rpm}
🥇 *सबसे अधिक एफिशिएंसी:* *${highest.id}* (*${highest.efficiency}%* • ${highest.fabric})
----------------------------------------
💡 मैकेनिक को ${lowest.id} की तुरंत जांच करने की सलाह दी जाती है।`;
      }

      return `⚡ *LOOMUS AI Loom Efficiency Analytics*
----------------------------------------
📈 *Fleet Average Efficiency:* *${avg}%*
🔻 *Lowest Efficiency Loom:* *${lowest.id}* (*${lowest.efficiency}%* • Status: ${lowest.status.toUpperCase()})
   Fabric: ${lowest.fabric} | RPM: ${lowest.rpm}
🥇 *Highest Efficiency Loom:* *${highest.id}* (*${highest.efficiency}%* • ${highest.fabric})
----------------------------------------
💡 Recommendation: Dispatch mechanic to inspect ${lowest.id}.`;
    }

    // 4. YARN / INVENTORY CONSUMPTION QUERY ("Aaj kitna yarn consume hua?")
    if (
      q.includes('yarn') ||
      q.includes('stock') ||
      q.includes('consume') ||
      q.includes('mal') ||
      q.includes('raw material') ||
      q.includes('kapad')
    ) {
      const stockItems = await Stock.find();
      const todayLogs = await ProductionLog.find({ createdAt: { $gte: todayStart, $lte: todayEnd } });
      const totalMeters = todayLogs.reduce((acc, l) => acc + (Number(l.output) || 0), 0);
      const estYarnKg = (totalMeters * 0.15).toFixed(1);
      const lowItems = stockItems.filter(s => s.current <= (s.minThreshold || 500));

      if (lang === 'gu') {
        return `🧵 *LOOMUS AI યાર્ન વપરાશ અને સ્ટોક રિપોર્ટ*
----------------------------------------
🧶 *આજ સુધી અંદાજિત વપરાયેલ યાર્ન:* *${estYarnKg} kg*
📦 *ગોડાઉનમાં કુલ ઉપલબ્ધ સ્ટોક:* *${stockItems.reduce((a, b) => a + (b.current || 0), 0).toLocaleString()} kg*
⚠️ *ઓછો સ્ટોક ધરાવતી આઈટમ્સ:* *${lowItems.length}*
${lowItems.map(i => `• ${i.name}: ${i.current} ${i.unit} (ઓછામાં ઓછું: ${i.minThreshold})`).join('\n') || '• બધી આઈટમ્સ પર્યાપ્ત છે'}
----------------------------------------
✅ LOOMUS AI ગોડાઉન મેનેજમેન્ટ`;
      }

      if (lang === 'hi') {
        return `🧵 *LOOMUS AI यार्न खपत और स्टॉक रिपोर्ट*
----------------------------------------
🧶 *आज अनुमानित यार्न खपत:* *${estYarnKg} kg*
📦 *गोदाम में कुल उपलब्ध स्टॉक:* *${stockItems.reduce((a, b) => a + (b.current || 0), 0).toLocaleString()} kg*
⚠️ *कम स्टॉक वाली सामग्री:* *${lowItems.length}*
${lowItems.map(i => `• ${i.name}: ${i.current} ${i.unit} (न्यूनतम: ${i.minThreshold})`).join('\n') || '• सभी सामग्री पर्याप्त मात्रा में है'}
----------------------------------------
✅ LOOMUS AI वेयरहाउस मैनेजमेंट`;
      }

      return `🧵 *LOOMUS AI Yarn Consumption & Inventory*
----------------------------------------
🧶 *Estimated Yarn Used Today:* *${estYarnKg} kg*
📦 *Total Yarn Stock Available:* *${stockItems.reduce((a, b) => a + (b.current || 0), 0).toLocaleString()} kg*
⚠️ *Items Below Minimum Threshold:* *${lowItems.length}*
${lowItems.map(i => `• ${i.name}: ${i.current} ${i.unit} (Min: ${i.minThreshold})`).join('\n') || '• All materials sufficient'}
----------------------------------------
✅ LOOMUS AI Inventory Engine`;
    }

    // 5. PENDING ORDERS QUERY ("Which orders are pending?")
    if (
      q.includes('order') ||
      q.includes('pending') ||
      q.includes('customer') ||
      q.includes('delivery') ||
      q.includes('sales')
    ) {
      const orders = await SalesOrder.find();
      const pending = orders.filter(o => o.status === 'Pending' || o.status === 'In Production');
      const totalPendingQty = pending.reduce((acc, o) => acc + (Number(o.qty) || 0), 0);

      const orderList = pending.slice(0, 4).map(o =>
        `• *${o.customer}*: ${o.qty}m (${o.fabric}) — डिलीवरी: ${o.deliveryDate ? o.deliveryDate.slice(0, 10) : 'TBD'}`
      ).join('\n') || (lang === 'gu' ? 'કોઈ પેન્ડિંગ ઓર્ડર નથી.' : lang === 'hi' ? 'कोई पेंडिंग ऑर्डर नहीं है।' : 'No pending orders.');

      if (lang === 'gu') {
        return `📦 *LOOMUS AI બાકી ઓર્ડર રિપોર્ટ*
----------------------------------------
⏳ *કુલ પેન્ડિંગ ઓર્ડર્સ:* *${pending.length} ઓર્ડર્સ (${totalPendingQty.toLocaleString()} મીટર)*
${orderList}
----------------------------------------
✅ LOOMUS AI સેલ્સ ટ્રેકિંગ`;
      }

      if (lang === 'hi') {
        return `📦 *LOOMUS AI लंबित ऑर्डर रिपोर्ट*
----------------------------------------
⏳ *कुल पेंडिंग ऑर्डर्स:* *${pending.length} ऑर्डर (${totalPendingQty.toLocaleString()} मीटर)*
${orderList}
----------------------------------------
✅ LOOMUS AI सेल्स ट्रैकिंग`;
      }

      return `📦 *LOOMUS AI Pending Orders Report*
----------------------------------------
⏳ *Total Pending Orders:* *${pending.length} orders (${totalPendingQty.toLocaleString()} meters)*
${orderList}
----------------------------------------
✅ LOOMUS AI Sales Engine`;
    }

    // 6. WORKER ATTENDANCE QUERY ("Attendance", "Kitne worker aaye hain?")
    if (
      q.includes('worker') ||
      q.includes('attendance') ||
      q.includes('operator') ||
      q.includes('karigar') ||
      q.includes('hajri') ||
      q.includes('hazri')
    ) {
      const workers = await Worker.find();
      const active = workers.filter(w => w.status === 'active').length;
      const onBreak = workers.filter(w => w.status === 'break').length;
      const off = workers.filter(w => w.status === 'off' || w.status === 'absent').length;

      if (lang === 'gu') {
        return `👥 *LOOMUS AI હાજરી અપડેટ*
----------------------------------------
🟢 *હાજર ઓપરેટર્સ:* *${active}*
🟡 *બ્રેક પર:* *${onBreak}*
🔴 *રજા / ગેરહાજર:* *${off}*
👥 *કુલ નોંધાયેલ કારીગરો:* *${workers.length}*
----------------------------------------
✅ LOOMUS AI સ્ટાફ મેનેજમેન્ટ`;
      }

      if (lang === 'hi') {
        return `👥 *LOOMUS AI उपस्थिति अपडेट*
----------------------------------------
🟢 *उपस्थित कारीगर:* *${active}*
🟡 *ब्रेक पर:* *${onBreak}*
🔴 *अवकाश / अनुपस्थित:* *${off}*
👥 *कुल पंजीकृत स्टाफ:* *${workers.length}*
----------------------------------------
✅ LOOMUS AI स्टाफ मैनेजमेंट`;
      }

      return `👥 *LOOMUS AI Floor Staff Attendance*
----------------------------------------
🟢 *Present / Active:* *${active} operators*
🟡 *On Break:* *${onBreak}*
🔴 *Off-duty / Absent:* *${off}*
👥 *Total Registered Staff:* *${workers.length}*
----------------------------------------
✅ LOOMUS AI Workforce Telemetry`;
    }

    // 7. DEFAULT HELP / UNRECOGNIZED QUERY
    if (lang === 'gu') {
      return `🤖 *નમસ્તે! હું LOOMUS મિલ AI આસિસ્ટન્ટ છું.*
હું ફેક્ટરીના લાઈવ ડેટાબેઝમાંથી તમને નીચે મુજબની માહિતી આપી શકું છું:

1️⃣ "આજે કેટલું ઉત્પાદન થયું?" (Production)
2️⃣ "કેટલા લૂમ બંધ છે?" (Loom Status)
3️⃣ "સૌથી ઓછી કાર્યક્ષમતા કયા લૂમની છે?" (Efficiency)
4️⃣ "આજે કેટલો યાર્ન વપરાયો?" (Yarn Consumption)
5️⃣ "કયા ઓર્ડર પેન્ડિંગ છે?" (Orders)
6️⃣ "કારીગરોની હાજરી કેટલી છે?" (Attendance)

કૃપા કરીને આમાંથી કોઈ પણ પ્રશ્ન પૂછો!`;
    }

    if (lang === 'hi') {
      return `🤖 *नमस्ते! मैं LOOMUS मिल AI असिस्टेंट हूँ।*
मैं फैक्ट्री के लाइव डेटाबेस से आपको निम्नलिखित जानकारी दे सकता हूँ:

1️⃣ "आज कितना उत्पादन हुआ?" (Production)
2️⃣ "कितने लूम बंद हैं?" (Loom Status)
3️⃣ "सबसे कम एफिशिएंसी किस लूम की है?" (Efficiency)
4️⃣ "आज कितना यार्न कंज्यूम हुआ?" (Yarn Consumption)
5️⃣ "कौन से ऑर्डर पेंडिंग हैं?" (Pending Orders)
6️⃣ "कारीगरों की हाजिरी कितनी है?" (Attendance)

कृपया इनमें से कोई भी प्रश्न पूछें!`;
    }

    return `🤖 *Hello! I am your LOOMUS Mill AI Assistant.*
I can answer operational questions from the factory live database in English, Hindi, or Gujarati:

1️⃣ *"How much production today?"* (Output & target)
2️⃣ *"How many looms are stopped?"* (Live fleet status)
3️⃣ *"Which loom has the lowest efficiency?"* (Telemetry)
4️⃣ *"How much yarn consumed?"* (Raw material audit)
5️⃣ *"Which orders are pending?"* (Order dispatch)
6️⃣ *"Show worker attendance"* (Floor workforce)

Please reply with your question!`;
  } catch (err) {
    logger.error('Error processing AI WhatsApp query:', err.message);
    return `⚠️ Error fetching factory data. Please try again or contact system administrator.`;
  }
}


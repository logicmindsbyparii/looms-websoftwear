// WhatsApp Communication & Business Notification Utility for LOOMUS Textile Suite with 4-Language Support
import { formatRupees, formatMeters, formatDate } from './formatters';
import { getCurrentLang } from '../api/client';

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export function openWhatsApp({ phone, message }) {
  const clean = cleanPhoneNumber(phone) || '919664683069';
  const encodedText = encodeURIComponent(message);
  let url = '';
  if (clean) {
    url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  window.open(url, '_blank');
}

export function buildAttendanceSummaryMessage(workers = []) {
  const lang = getCurrentLang();
  const today = formatDate(new Date().toISOString());
  const active = workers.filter(w => w.status === 'active').length;
  const breakCount = workers.filter(w => w.status === 'break').length;
  const offCount = workers.filter(w => w.status === 'off' || w.status === 'absent').length;

  if (lang === 'gu') {
    return `👥 *LOOMUS ટેક્સટાઇલ મિલ — સ્ટાફ હાજરી અહેવાલ*
📅 *તારીખ:* ${today}
----------------------------------------
🟢 *હાજર કારીગરો:* ${active}
🟡 *વિરામ પર:* ${breakCount}
🔴 *ગેરહાજર / રજા:* ${offCount}
👥 *કુલ નોંધાયેલ સ્ટાફ:* ${workers.length}
----------------------------------------
✅ LOOMUS 2.0 સ્ટાફ મેનેજમેન્ટ`;
  }

  if (lang === 'hi') {
    return `👥 *LOOMUS टेक्सटाइल मिल — कर्मचारी उपस्थिति रिपोर्ट*
📅 *दिनांक:* ${today}
----------------------------------------
🟢 *उपस्थित कारीगर:* ${active}
🟡 *विराम पर:* ${breakCount}
🔴 *अनुपस्थित / अवकाश:* ${offCount}
👥 *कुल पंजीकृत स्टाफ:* ${workers.length}
----------------------------------------
✅ LOOMUS 2.0 स्टाफ मैनेजमेंट`;
  }

  if (lang === 'mr') {
    return `👥 *LOOMUS टेक्सटाईल मिल — कर्मचारी उपस्थिती अहवाल*
📅 *तारीख:* ${today}
----------------------------------------
🟢 *हजर कामगार:* ${active}
🟡 *विरामावर:* ${breakCount}
🔴 *गैरहजर / सुट्टी:* ${offCount}
👥 *एकूण नोंदणीकृत कर्मचारी:* ${workers.length}
----------------------------------------
✅ LOOMUS 2.0 कर्मचारी व्यवस्थापन`;
  }

  return `👥 *LOOMUS TEXTILE MILL — STAFF ATTENDANCE REPORT*
📅 *Date:* ${today}
----------------------------------------
🟢 *Active Workers:* ${active}
🟡 *On Break:* ${breakCount}
🔴 *Off Duty / Absent:* ${offCount}
👥 *Total Roster:* ${workers.length}
----------------------------------------
✅ LOOMUS 2.0 Staff Management`;
}

export function buildReadyGoodsMessage(goods) {
  const lang = getCurrentLang();
  const today = formatDate(new Date().toISOString());
  const meters = goods.meters || goods.qty || 0;
  const rolls = goods.rolls || goods.rollCount || 1;

  if (lang === 'gu') {
    return `📦 *LOOMUS ટેક્સટાઇલ મિલ — તૈયાર માલ લોટ સ્લિપ (ગોડાઉન સ્ટોક)*
----------------------------------------
🏷️ *લોટ નંબર:* ${goods.id}
🧵 *કાપડ ક્વોલિટી:* ${goods.fabric}
📏 *કુલ મીટર:* ${formatMeters(meters)}
🧶 *તાકા સંખ્યા:* ${rolls} તાકા (Rolls)
🏢 *ગોડાઉન સ્થાન:* ${goods.location || 'મેઈન વેરહાઉસ'}
⭐ *ગ્રેડ ગુણવત્તા:* ${goods.quality || 'A-ગ્રેડ નિકાસ'}
📅 *તારીખ:* ${today}
----------------------------------------
✅ *સ્થિતિ:* ${goods.status || 'તૈયાર સ્ટોક'}`;
  }

  if (lang === 'hi') {
    return `📦 *LOOMUS टेक्सटाइल मिल — तैयार माल लॉट पर्ची (गोदाम स्टॉक)*
----------------------------------------
🏷️ *लॉट संख्या:* ${goods.id}
🧵 *कपड़े की किस्म:* ${goods.fabric}
📏 *कुल मीटर:* ${formatMeters(meters)}
🧶 *थान संख्या:* ${rolls} थान (Rolls)
🏢 *गोदाम स्थान:* ${goods.location || 'मुख्य गोदाम'}
⭐ *ग्रेड गुणवत्ता:* ${goods.quality || 'A-ग्रेड निर्यात'}
📅 *दिनांक:* ${today}
----------------------------------------
✅ *स्थिति:* ${goods.status || 'तैयार स्टॉक'}`;
  }

  if (lang === 'mr') {
    return `📦 *LOOMUS टेक्सटाईल मिल — तयार माल लॉट पावती (गोदाम साठा)*
----------------------------------------
🏷️ *लॉट क्रमांक:* ${goods.id}
🧵 *कापडाचा प्रकार:* ${goods.fabric}
📏 *एकूण मीटर:* ${formatMeters(meters)}
🧶 *ताका संख्या:* ${rolls} ताके (Rolls)
🏢 *गोदाम स्थान:* ${goods.location || 'मुख्य वेअरहाऊस'}
⭐ *दर्जा गुणवत्ता:* ${goods.quality || 'A-दर्जा निर्यात'}
📅 *तारीख:* ${today}
----------------------------------------
✅ *स्थिती:* ${goods.status || 'तयार साठा'}`;
  }

  return `📦 *LOOMUS TEXTILE MILL — READY GOODS ROLL LOT SLIP*
----------------------------------------
🏷️ *Lot ID:* ${goods.id}
🧵 *Fabric Quality:* ${goods.fabric}
📏 *Total Meterage:* ${formatMeters(meters)}
🧶 *Rolls Count:* ${rolls} Rolls
🏢 *Godown Location:* ${goods.location || 'Main Warehouse'}
⭐ *Fabric Grade:* ${goods.quality || 'A-Grade (Export)'}
📅 *Date:* ${today}
----------------------------------------
✅ *Status:* ${goods.status || 'Ready in Stock'}`;
}

/**
 * 1. Raw Yarn Inward Message
 */
export function buildYarnInwardMessage(yarn) {
  const lang = getCurrentLang();
  const today = formatDate(new Date().toISOString());
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const qty = yarn.qty || yarn.current || 0;
  const rate = yarn.rate || 0;
  const total = qty * rate;

  if (lang === 'gu') {
    return `🏭 *LOOMUS ટેક્સટાઇલ મિલ — કાચો માલ આવક (યાર્ન ઇનવર્ડ)*
----------------------------------------
📦 *માલ / યાર્ન:* ${yarn.material || yarn.name}
⚖️ *મેળવેલ જથ્થો:* ${qty.toLocaleString()} kg
🏭 *સપ્લાયર / મિલ:* ${yarn.supplier || 'સ્થાનિક સપ્લાયર'}
💰 *ખરીદ ભાવ:* ₹${rate} / kg
💵 *કુલ રકમ:* ${formatRupees(total)}
🧾 *ચલણ / બિલ નં:* ${yarn.invoice || yarn.id || 'N/A'}
📅 *તારીખ અને સમય:* ${yarn.date || today} - ${time}
----------------------------------------
✅ *સ્થિતિ:* સ્ટોક ચકાસીને ગોડાઉનમાં જમા કર્યો.`;
  }

  if (lang === 'hi') {
    return `🏭 *LOOMUS टेक्सटाइल मिल — कच्चा माल आवक (धागा इनवर्ड)*
----------------------------------------
📦 *सामग्री / धागा:* ${yarn.material || yarn.name}
⚖️ *प्राप्त मात्रा:* ${qty.toLocaleString()} kg
🏭 *आपूर्तिकर्ता / मिल:* ${yarn.supplier || 'स्थानीय आपूर्तिकर्ता'}
💰 *क्रय दर:* ₹${rate} / kg
💵 *कुल राशि:* ${formatRupees(total)}
🧾 *चालान / बिल संख्या:* ${yarn.invoice || yarn.id || 'N/A'}
📅 *दिनांक एवं समय:* ${yarn.date || today} - ${time}
----------------------------------------
✅ *स्थिति:* स्टॉक सत्यापित कर गोदाम में दर्ज किया गया।`;
  }

  if (lang === 'mr') {
    return `🏭 *LOOMUS टेक्सटाईल मिल — कच्चा माल आवक (सूत इनवर्ड)*
----------------------------------------
📦 *माल / सूत:* ${yarn.material || yarn.name}
⚖️ *मिळालेले प्रमाण:* ${qty.toLocaleString()} kg
🏭 *पुरवठादार / मिल:* ${yarn.supplier || 'स्थानिक पुरवठादार'}
💰 *खरेदी दर:* ₹${rate} / kg
💵 *एकूण रक्कम:* ${formatRupees(total)}
🧾 *चलन / बिल क्रमांक:* ${yarn.invoice || yarn.id || 'N/A'}
📅 *तारीख आणि वेळ:* ${yarn.date || today} - ${time}
----------------------------------------
✅ *स्थिती:* साठा तपासून गोदामात नोंदवला गेला.`;
  }

  return `🏭 *LOOMUS TEXTILE MILL — RAW YARN INWARD*
----------------------------------------
📦 *Material / Yarn:* ${yarn.material || yarn.name}
⚖️ *Quantity Received:* ${qty.toLocaleString()} kg
🏭 *Supplier / Mill:* ${yarn.supplier || 'Local Supplier'}
💰 *Purchase Rate:* ₹${rate} / kg
💵 *Total Lot Amount:* ${formatRupees(total)}
🧾 *Challan / Bill No:* ${yarn.invoice || yarn.id || 'N/A'}
📅 *Date & Time:* ${yarn.date || today} at ${time}
----------------------------------------
✅ *Status:* Stock verified & added into Mill Godown.`;
}

/**
 * 2. Sales Order / Cloth Dispatch Message
 */
export function buildSalesOrderMessage(order) {
  const lang = getCurrentLang();
  const today = formatDate(new Date().toISOString());
  const qty = order.qty || 0;
  const rate = order.rate || 0;
  const total = order.total || (qty * rate);
  const advance = order.advance || 0;
  const balance = total - advance;

  if (lang === 'gu') {
    return `🏷️ *LOOMUS ટેક્સટાઇલ મિલ — વેચાણ ઓર્ડર / કાપડ ડિસ્પેચ*
----------------------------------------
🔖 *ઓર્ડર નંબર:* ${order.id}
👔 *ખરીદદાર પાર્ટી:* ${order.buyer}
🤝 *દલાલ:* ${order.broker || 'ડાયરેક્ટ વેચાણ'}
🧵 *કાપડનો પ્રકાર:* ${order.fabric}
📏 *જથ્થો (મીટર):* ${formatMeters(qty)}
💵 *ભાવ:* ₹${rate} / m
💰 *કુલ બિલ રકમ:* ${formatRupees(total)}
💳 *મળેલ એડવાન્સ:* ${formatRupees(advance)}
📌 *બાકી રકમ:* ${formatRupees(balance)}
🚚 *ડિલિવરી તારીખ:* ${order.deliveryDate || today}
----------------------------------------
✅ *સ્થિતિ:* ${order.status || 'ઉત્પાદનમાં છે'}`;
  }

  if (lang === 'hi') {
    return `🏷️ *LOOMUS टेक्सटाइल मिल — बिक्री आदेश / कपड़ा प्रेषण*
----------------------------------------
🔖 *आदेश संख्या:* ${order.id}
👔 *खरीदार पार्टी:* ${order.buyer}
🤝 *दलाल:* ${order.broker || 'प्रत्यक्ष बिक्री'}
🧵 *कपड़े की किस्म:* ${order.fabric}
📏 *मात्रा (मीटर):* ${formatMeters(qty)}
💵 *दर:* ₹${rate} / m
💰 *कुल बिल राशि:* ${formatRupees(total)}
💳 *प्राप्त अग्रिम:* ${formatRupees(advance)}
📌 *शेष राशि:* ${formatRupees(balance)}
🚚 *वितरण तिथि:* ${order.deliveryDate || today}
----------------------------------------
✅ *स्थिति:* ${order.status || 'उत्पादन में है'}`;
  }

  if (lang === 'mr') {
    return `🏷️ *LOOMUS टेक्सटाईल मिल — विक्री आदेश / कापड पाठवणे*
----------------------------------------
🔖 *आदेश क्रमांक:* ${order.id}
👔 *ग्राहक पार्टी:* ${order.buyer}
🤝 *दलाल:* ${order.broker || 'थेट विक्री'}
🧵 *कापडाचा प्रकार:* ${order.fabric}
📏 *प्रमाण (मीटर):* ${formatMeters(qty)}
💵 *दर:* ₹${rate} / m
💰 *एकूण बिल रक्कम:* ${formatRupees(total)}
💳 *मिळालेली आगाऊ रक्कम:* ${formatRupees(advance)}
📌 *उर्वरित रक्कम:* ${formatRupees(balance)}
🚚 *वितरण तारीख:* ${order.deliveryDate || today}
----------------------------------------
✅ *स्थिती:* ${order.status || 'उत्पादनात आहे'}`;
  }

  return `🏷️ *LOOMUS TEXTILE MILL — SALES BOOKING / DISPATCH*
----------------------------------------
🔖 *Order No:* ${order.id}
👔 *Buyer Party:* ${order.buyer}
🤝 *Market Broker:* ${order.broker || 'Direct Sale'}
🧵 *Fabric Variety:* ${order.fabric}
📏 *Quantity (Meters):* ${formatMeters(qty)}
💵 *Rate:* ₹${rate} / m
💰 *Total Bill Value:* ${formatRupees(total)}
💳 *Advance Received:* ${formatRupees(advance)}
📌 *Balance Remaining:* ${formatRupees(balance)}
🚚 *Delivery Date:* ${order.deliveryDate || today}
----------------------------------------
✅ *Status:* ${order.status || 'In Production / Ready'}`;
}

/**
 * 3. Daily Executive Plant Report to Admin
 */
export function buildDailyAdminExecutiveReport({ machines = [], productionLogs = [], salesOrders = [], stockLevels = [], alarms = [] }) {
  const lang = getCurrentLang();
  const today = formatDate(new Date().toISOString());
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const runningCount = machines.filter(m => m.status === 'running').length;
  const totalMeters = machines.reduce((acc, m) => acc + (m.output || 0), 0);
  const avgEfficiency = runningCount > 0
    ? Math.round(machines.filter(m => m.status === 'running').reduce((acc, m) => acc + (m.efficiency || 0), 0) / runningCount)
    : 0;

  const totalYarnKg = stockLevels.reduce((acc, s) => acc + (s.current || 0), 0);
  const yarnValuation = stockLevels.reduce((acc, s) => acc + ((s.current || 0) * (s.rate || 0)), 0);
  const totalSalesVal = salesOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const criticalAlarms = alarms.filter(a => a.type === 'critical').length;

  if (lang === 'gu') {
    return `📊 *LOOMUS ટેક્સટાઇલ મિલ — દૈનિક એક્ઝિક્યુટિવ અહેવાલ (એડમિન માટે)*
📅 *તારીખ:* ${today} | ⏰ *સમય:* ${time}
========================================
🏭 *૧. લૂમ પ્લાન્ટ ટેલિમેટ્રી:*
• સક્રિય લૂમ: *${runningCount} / ${machines.length} ચાલુ એકમો*
• શિફ્ટનું કુલ કાપડ ઉત્પાદન: *${formatMeters(totalMeters)}*
• સરેરાશ પ્લાન્ટ કાર્યક્ષમતા: *${avgEfficiency}%*

📦 *૨. યાર્ન સ્ટોક અને ગોડાઉન:*
• ઉપલબ્ધ યાર્ન સ્ટોક: *${totalYarnKg.toLocaleString()} kg*
• સ્ટોકનું વર્તમાન મૂલ્યાંકન: *${formatRupees(yarnValuation)}*

💼 *૩. વેચાણ અને વ્યાપાર ઓર્ડર:*
• બુક થયેલા ઓર્ડર: *${salesOrders.length} ઓર્ડર*
• કુલ ઓર્ડર રકમ: *${formatRupees(totalSalesVal)}*

🚨 *૪. સુરક્ષા અને એલાર્મ:*
• ગંભીર મશીન ફોલ્ટ: *${criticalAlarms}*
• સક્રિય એલાર્મ નોટિસ: *${alarms.length}*
========================================
🚀 *LOOMUS 2.0 ટેક્સટાઇલ સ્યુટ*`;
  }

  if (lang === 'hi') {
    return `📊 *LOOMUS टेक्सटाइल मिल — दैनिक कार्यकारी रिपोर्ट (एडमिन हेतु)*
📅 *दिनांक:* ${today} | ⏰ *समय:* ${time}
========================================
🏭 *१. लूम प्लांट टेलीमेट्री:*
• सक्रिय लूम: *${runningCount} / ${machines.length} चालू इकाइयां*
• शिफ्ट का कुल कपड़ा उत्पादन: *${formatMeters(totalMeters)}*
• औसत संयंत्र दक्षता: *${avgEfficiency}%*

📦 *२. धागा स्टॉक एवं गोदाम:*
• उपलब्ध धागा स्टॉक: *${totalYarnKg.toLocaleString()} kg*
• वर्तमान स्टॉक मूल्यांकन: *${formatRupees(yarnValuation)}*

💼 *३. बिक्री एवं व्यापारिक आदेश:*
• बुक किए गए आदेश: *${salesOrders.length} अनुबंध*
• कुल आदेश राशि: *${formatRupees(totalSalesVal)}*

🚨 *४. सुरक्षा एवं अलार्म:*
• गंभीर मशीन ट्रिप: *${criticalAlarms}*
• सक्रिय अलार्म सूचनाएं: *${alarms.length}*
========================================
🚀 *LOOMUS 2.0 टेक्सटाइल सुइट*`;
  }

  if (lang === 'mr') {
    return `📊 *LOOMUS टेक्सटाईल मिल — दैनिक कार्यकारी अहवाल (अ‍ॅडमिनसाठी)*
📅 *तारीख:* ${today} | ⏰ *वेळ:* ${time}
========================================
🏭 *१. लूम प्लांट टेलिमेट्री:*
• सक्रिय लूम: *${runningCount} / ${machines.length} चालू मशिन्स*
• एकूण कापड उत्पादन: *${formatMeters(totalMeters)}*
• सरासरी गिरणी कार्यक्षमता: *${avgEfficiency}%*

📦 *२. सूत साठा आणि गोदाम:*
• उपलब्ध सूत साठा: *${totalYarnKg.toLocaleString()} kg*
• सध्याचे साठा मूल्यांकन: *${formatRupees(yarnValuation)}*

💼 *३. विक्री आणि व्यापारी ऑर्डर्स:*
• नोंदवलेले आदेश: *${salesOrders.length} कंत्राटे*
• एकूण ऑर्डर रक्कम: *${formatRupees(totalSalesVal)}*

🚨 *४. सुरक्षा आणि अलार्म:*
• गंभीर मशिन्स ट्रिप: *${criticalAlarms}*
• सक्रिय अलार्म सूचना: *${alarms.length}*
========================================
🚀 *LOOMUS 2.0 टेक्सटाईल सूट*`;
  }

  return `📊 *LOOMUS TEXTILE MILL — DAILY EXECUTIVE REPORT (FOR ADMIN)*
📅 *Date:* ${today} | ⏰ *Time:* ${time}
========================================

🏭 *1. PLANT WEAVING TELEMETRY:*
• Active Looms: *${runningCount} / ${machines.length} units running*
• Total Shift Weaving Output: *${formatMeters(totalMeters)}*
• Fleet Average Efficiency: *${avgEfficiency}%*

📦 *2. RAW YARN INWARD & GODOWN:*
• Yarn in Stock: *${totalYarnKg.toLocaleString()} kg*
• Current Stock Valuation: *${formatRupees(yarnValuation)}*

💼 *3. SALES & COMMERCIAL ORDERS:*
• Orders Booked: *${salesOrders.length} contracts*
• Total Order Value: *${formatRupees(totalSalesVal)}*

🚨 *4. SAFETY & QUALITY AUDIT:*
• Critical Machine Trips: *${criticalAlarms} breakages*
• Active Safety Alerts: *${alarms.length} notices*

========================================
🚀 *LOOMUS 2.0 Smart Textile Suite*`;
}

export function buildRollMessage(roll, publicUrl = '') {
  const lang = getCurrentLang();
  const url = publicUrl || `${window.location.origin}/?roll=${roll.qrToken || roll.id}`;
  const metresStr = `${Number(roll.metres).toFixed(2)}m`;
  const machineStr = roll.machineName || roll.machineId || 'Loom';
  const locationStr = roll.locationId || 'Floor';

  if (lang === 'gu') {
    return `🏷️ *LOOMUS ટેક્સટાઇલ — તાકા રોલ વિગતો*
🆔 *રોલ ID:* ${roll.id}
🧵 *કાપડ:* ${roll.fabric}
✨ *ગુણવત્તા:* ${roll.quality || 'A-Grade'}
📏 *લંબાઈ:* ${metresStr}
🏭 *લૂમ:* ${machineStr}
📍 *સ્થાન:* ${locationStr}
🟢 *સ્થિતિ:* ${roll.status}
----------------------------------------
📲 *QR ચકાસણી લિંક:*
${url}
----------------------------------------
✅ LOOMUS 2.0 રોલ ટ્રેકિંગ`;
  }

  if (lang === 'hi') {
    return `🏷️ *LOOMUS टेक्सटाइल — ताका रोल विवरण*
🆔 *रोल ID:* ${roll.id}
🧵 *कपड़ा:* ${roll.fabric}
✨ *गुणवत्ता:* ${roll.quality || 'A-Grade'}
📏 *लंबाई:* ${metresStr}
🏭 *लूम मशीन:* ${machineStr}
📍 *स्थान:* ${locationStr}
🟢 *स्थिति:* ${roll.status}
----------------------------------------
📲 *QR सत्यापन लिंक:*
${url}
----------------------------------------
✅ LOOMUS 2.0 रोल ट्रैकिंग`;
  }

  if (lang === 'mr') {
    return `🏷️ *LOOMUS टेक्सटाईल — ताका रोल तपशील*
🆔 *रोल ID:* ${roll.id}
🧵 *कापड:* ${roll.fabric}
✨ *दर्जा:* ${roll.quality || 'A-Grade'}
📏 *लांबी:* ${metresStr}
🏭 *लूम मशीन:* ${machineStr}
📍 *स्थान:* ${locationStr}
🟢 *स्थिती:* ${roll.status}
----------------------------------------
📲 *QR पडताळणी लिंक:*
${url}
----------------------------------------
✅ LOOMUS 2.0 रोल ट्रॅकिंग`;
  }

  return `🏷️ *LOOMUS TEXTILE — FABRIC ROLL DETAILS*
🆔 *Roll ID:* ${roll.id}
🧵 *Fabric:* ${roll.fabric}
✨ *Quality:* ${roll.quality || 'A-Grade (Export)'}
📏 *Length:* ${metresStr}
🏭 *Loom:* ${machineStr}
📍 *Location:* ${locationStr}
🟢 *Status:* ${roll.status}
----------------------------------------
📲 *Verify & Track QR:*
${url}
----------------------------------------
✅ LOOMUS 2.0 Roll QR Tracking`;
}

export function parseGerman(value) {
  const s = String(value).trim().replace(/[\s\u00a0\u202f]/g, '');
  if (!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s)) throw new Error('Bitte gib eine gültige Zahl ein, z. B. 1.250,50.');
  const n = Number(s.replaceAll('.', '').replace(',', '.'));
  if (!Number.isFinite(n) || Math.abs(n) > 1e12) throw new Error('Bitte verwende Zahlen zwischen −1 Billion und 1 Billion.');
  return n;
}
export const modes = {
  value: { title: 'Prozentwert', question: 'Wie viel sind … % von …?', a:'Prozentsatz', b:'Grundwert', unitA:'%', unitB:'', defaults:['25','200'], result:'Prozentwert', formula:'Grundwert × Prozentsatz ÷ 100', symbol:'% von', example:'25 % von 200 = 50' },
  rate: { title: 'Prozentsatz', question: 'Wie viel Prozent ist ein Teil vom Ganzen?', a:'Teilwert', b:'Grundwert', unitA:'', unitB:'', defaults:['50','200'], result:'Prozentsatz', formula:'Teilwert ÷ Grundwert × 100', symbol:'%?', example:'50 von 200 = 25 %' },
  base: { title: 'Grundwert', question: 'Wie groß ist das Ganze?', a:'Prozentwert', b:'Prozentsatz', unitA:'', unitB:'%', defaults:['50','25'], result:'Grundwert', formula:'Prozentwert ÷ Prozentsatz × 100', symbol:'100 %', example:'50 sind 25 % von 200' },
  change: { title: 'Veränderung', question: 'Um wie viel Prozent hat sich ein Wert verändert?', a:'Alter Wert', b:'Neuer Wert', unitA:'', unitB:'', defaults:['200','250'], result:'Prozentuale Veränderung', formula:'(Neuer Wert − alter Wert) ÷ alter Wert × 100', symbol:'↗', example:'Von 200 auf 250 = +25 %' },
  adjust: { title: 'Zu- & Abschlag', question: 'Prozent aufschlagen oder abziehen', a:'Ausgangswert', b:'Prozentsatz', unitA:'', unitB:'%', defaults:['80','20'], result:'Neuer Wert', formula:'Ausgangswert × (1 ± Prozentsatz ÷ 100)', symbol:'± %', example:'80 minus 20 % = 64' },
  reverse: { title: 'Ausgangswert', question: 'Welcher Wert lag vor der Veränderung vor?', a:'Endwert', b:'Veränderung', unitA:'', unitB:'%', defaults:['120','20'], result:'Ursprünglicher Wert', formula:'Endwert ÷ (1 ± Prozentsatz ÷ 100)', symbol:'↶', example:'120 nach +20 % → vorher 100' }
};
export function calculate(mode,a,b,direction='plus') {
  if (!modes[mode] || !Number.isFinite(a) || !Number.isFinite(b) || !['plus','minus'].includes(direction)) throw new Error('Bitte prüfe deine Eingaben.');
  if ((mode==='rate'||mode==='base') && b===0) throw new Error('Durch 0 kann nicht geteilt werden. Bitte ändere den zweiten Wert.');
  if (mode==='change' && a<=0) throw new Error('Für diesen Vergleich muss der alte Wert größer als 0 sein.');
  const factor=1+(direction==='minus'?-b:b)/100;
  if (mode==='reverse' && factor<=0) throw new Error('Der Änderungsfaktor muss größer als 0 sein. Bei einer Senkung muss der Prozentsatz unter 100 % liegen.');
  const result={value:()=>a*b/100,rate:()=>a/b*100,base:()=>a/b*100,change:()=>(b-a)/a*100,adjust:()=>a*factor,reverse:()=>a/factor}[mode]();
  if (!Number.isFinite(result)) throw new Error('Das Ergebnis ist zu groß. Bitte verwende kleinere Werte.');
  return Object.is(result,-0)?0:result;
}
export const format = n => new Intl.NumberFormat('de-DE',{maximumFractionDigits:8}).format(n);

import {modes,parseGerman,calculate,format} from './calculator.mjs';
let active='value';
const $=id=>document.getElementById(id), saved={};
function render(){
 const m=modes[active]; $('question').textContent=m.question;
 for(const letter of ['a','b']) { $('label-'+letter).textContent=m[letter]; $('unit-'+letter).textContent=m['unit'+letter.toUpperCase()]; }
 $('input-a').value=(saved[active]||m.defaults)[0]; $('input-b').value=(saved[active]||m.defaults)[1];
 $('direction-wrap').hidden=!['adjust','reverse'].includes(active);
 $('direction').value=active==='adjust'?'minus':'plus';
 $('result-label').textContent=m.result;
 document.querySelectorAll('[data-mode]').forEach(btn=>{btn.setAttribute('aria-pressed',String(btn.dataset.mode===active));});
 update();
}
function update(){
 saved[active]=[$('input-a').value,$('input-b').value];
 try {
  const a=parseGerman($('input-a').value), b=parseGerman($('input-b').value), d=$('direction').value;
  const r=calculate(active,a,b,d), f=format;
  $('error').textContent=''; $('result').textContent=(active==='change'&&r>0?'+':'')+f(r)+(['rate','change'].includes(active)?' %':'');
  const equations={value:`${f(a)} ÷ 100 × ${f(b)} = ${f(r)}`,rate:`${f(a)} ÷ ${f(b)} × 100 = ${f(r)} %`,base:`${f(a)} ÷ ${f(b)} × 100 = ${f(r)}`,change:`(${f(b)} − ${f(a)}) ÷ ${f(a)} × 100 = ${f(r)} %`,adjust:`${f(a)} × (1 ${d==='minus'?'−':'+'} ${f(b)} ÷ 100) = ${f(r)}`,reverse:`${f(a)} ÷ (1 ${d==='minus'?'−':'+'} ${f(b)} ÷ 100) = ${f(r)}`};
  $('equation').textContent=equations[active]; $('formula').textContent=modes[active].formula;
  $('result-note').textContent=active==='value'?`${f(a)} % von ${f(b)} sind ${f(r)}.`:active==='change'?(r===0?'Der Wert ist unverändert.':`Der Wert ist um ${f(Math.abs(r))} % ${r>0?'gestiegen':'gesunken'}.`):'Berechnet mit deinen Eingaben.';
  $('visual').hidden=active!=='value'||a<0||a>100||b<=0;
  $('bar').style.width=Math.min(100,Math.max(0,a))+'%'; $('bar-label').textContent=`${f(a)} %`; $('whole-label').textContent=`100 % = ${f(b)}`;
  $('copy').disabled=false;
 } catch(e) { $('error').textContent=e.message; $('result').textContent='—'; $('equation').textContent='Bitte prüfe deine Eingaben.'; $('result-note').textContent=''; $('visual').hidden=true; $('copy').disabled=true; }
}
document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{active=btn.dataset.mode;render();}));
$('calculator-form').addEventListener('submit',e=>{e.preventDefault();update();});
for(const id of ['input-a','input-b','direction']) $(id).addEventListener('input',update);
$('reset').addEventListener('click',()=>{delete saved[active];render();$('input-a').focus();});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('result').textContent);$('copy').textContent='Kopiert ✓';}catch{$('copy').textContent='Bitte Ergebnis markieren';}setTimeout(()=>$('copy').textContent='Ergebnis kopieren',2000);});
document.querySelectorAll('[data-example]').forEach(btn=>btn.addEventListener('click',()=>{active=btn.dataset.example;delete saved[active];render();$('rechner').scrollIntoView({behavior:'smooth'});$('input-a').focus({preventScroll:true});}));
render();
if(document.modelContext?.registerTool) {
 try { Promise.resolve(document.modelContext.registerTool({name:'calculate_percentage',description:'Calculate a percentage and show the inputs and result in the calculator.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:Object.keys(modes)},a:{type:'string',description:'German number, decimal comma, e.g. 1.250,50'},b:{type:'string'},direction:{type:'string',enum:['plus','minus']}},required:['mode','a','b'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const a=parseGerman(input.a),b=parseGerman(input.b);const result=calculate(input.mode,a,b,input.direction||'plus');active=input.mode;saved[active]=[input.a,input.b];render();$('direction').value=input.direction||'plus';update();return {result,mode:active};}})).catch(()=>{}); }catch{}
}

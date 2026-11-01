/* GOYAL ELECTRICAL CRM — Firebase Authentication + Cloud Firestore */
const $=s=>document.querySelector(s);
const firebaseConfig={apiKey:"AIzaSyAwHtPTMJVjxnValmjAv5pERLFfm2BCzho",authDomain:"goyalelectricalcrm.firebaseapp.com",projectId:"goyalelectricalcrm",storageBucket:"goyalelectricalcrm.firebasestorage.app",messagingSenderId:"218690634741",appId:"1:218690634741:web:c3352fc4ab3837c9e956bc",measurementId:"G-F6BR2CT9ZN"};
const firebaseReady=!!window.firebase?.apps;
if(firebaseReady&&!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const auth=firebaseReady?firebase.auth():null,db=firebaseReady?firebase.firestore():null;
const TABLES={leads:"leads",customers:"customers",followups:"followups",sites:"sites",products:"products",quotations:"quotations",orders:"orders"};
const state={page:"dashboard",orgId:null,role:null,user:null,companyId:"",companies:[],data:{leads:[],customers:[],followups:[],sites:[],products:[],quotations:[],orders:[]}};
let editing=null,authMode="signin";
const titles={dashboard:["Dashboard","Live business overview"],leads:["Leads & Pipeline","Track prospects from first contact to conversion."],customers:["Customers","Your customer directory"],followups:["Follow-ups & Tasks","Never miss a customer commitment."],sites:["Sites & Projects","Manage site visits and project progress."],products:["Products","Product catalogue and indicative pricing."],quotations:["Quotations","Prepare and track customer quotations."],orders:["Sales Orders","Manage customer orders independently in your CRM."],reports:["Reports","Review pipeline and export business records."]};
const fields={
leads:[["business_name","Business name","text",1],["contact_person","Contact person","text"],["phone","Phone","tel"],["email","Email","email"],["source","Lead source","text"],["stage","Pipeline stage","select","New|Contacted|Qualified|Site Visit|Quotation Sent|Negotiation|Won|Lost"],["estimated_value","Potential value (₹)","number"],["next_follow_up","Next follow-up","date"]],
customers:[["name","Customer name","text",1],["contact_person","Contact person","text"],["phone","Phone","tel"],["email","Email","email"],["city","City","text"],["customer_type","Customer type","select","Retail|Contractor|Builder|Dealer|Corporate|Other"],["address","Address","text"],["notes","Notes","textarea"]],
followups:[["title","Task / follow-up","text",1],["due_at","Due date","date"],["assigned_to","Assigned user ID (optional)","text"],["status","Status","select","Pending|Completed|Rescheduled"],["notes","Notes","textarea"]],
sites:[["name","Project / site name","text",1],["location","Location","text"],["status","Status","select","New|Survey required|Scheduled|In progress|On hold|Completed"],["site_contact","Site contact","text"],["expected_value","Expected value (₹)","number"],["notes","Notes","textarea"]],
products:[["name","Product name","text",1],["sku","SKU / item code","text"],["brand","Brand","select","Havells|Orient Plum|TRENZLITE|APAR|Other"],["category","Category","text"],["unit","Unit","text"],["hsn","HSN / SAC","text"],["gst","GST rate (%)","select","0|5|12|18|28"],["indicative_price","Selling rate (₹)","number"],["minimum_stock","Minimum stock","number"]],
quotations:[["quotation_number","Quotation number","text",1],["quotation_date","Quotation date","date"],["valid_until","Valid until","date"],["amount","Total amount (₹)","number"],["status","Status","select","Draft|Sent|Accepted|Rejected|Expired"],["notes","Notes","textarea"]],
orders:[["order_number","Order number","text",1],["order_date","Order date","date"],["amount","Total amount (₹)","number"],["status","Order status","select","Pending|Confirmed|In progress|Completed|Cancelled"],["notes","Notes","textarea"]]
};
const labels={leads:"lead",customers:"customer",followups:"follow-up",sites:"site/project",products:"product",quotations:"quotation",orders:"sales order"};
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(v){return "₹"+Number(v||0).toLocaleString("en-IN")}
function toast(s,bad=false){const t=$("#toast");t.textContent=s;t.style.background=bad?"#8b2525":"#142f49";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3200)}
function status(s){const v=String(s||"—");const cls=["Won","Completed","Accepted","posted"].includes(v)?"green":["Pending","New","Quotation Sent","pending_review","Draft"].includes(v)?"amber":["Lost","Rejected","failed","Cancelled"].includes(v)?"red":"";return '<span class="status '+cls+'">'+esc(v.replaceAll("_"," "))+"</span>"}
function companyFilter(q){return q.where("companyId","==",state.companyId)}
function authNote(msg,error=false){const n=$("#authFeedback");if(n){n.textContent=msg;n.classList.toggle("error",error)}}
function authModeRender(){ $("#authTitle").textContent=authMode==="signin"?"Sign in to your CRM":"Create staff account";$("#authSubmit").textContent=authMode==="signin"?"Sign in":"Create account";$("#authToggle").textContent=authMode==="signin"?"Need an account? Create staff account":"Already registered? Sign in";authNote("")}
$("#authToggle").addEventListener("click",()=>{authMode=authMode==="signin"?"signup":"signin";authModeRender()});
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();if(!auth){authNote("Firebase did not load. Refresh and try again.",true);return}const btn=$("#authSubmit");btn.disabled=true;authNote("Please wait…");try{const email=$("#authEmail").value.trim(),password=$("#authPassword").value; if(authMode==="signin") await auth.signInWithEmailAndPassword(email,password); else await auth.createUserWithEmailAndPassword(email,password);}catch(err){authNote(err.message||"Could not sign in.",true)}finally{btn.disabled=false}});
$("#authToggle").addEventListener("keydown",()=>{});
async function startWorkspace(user){
 state.user=user;authNote("Loading your Firestore workspace…");
 try{
  const memberRef=db.collection("memberships").doc(user.uid);let memberSnap=await memberRef.get();
  if(!memberSnap.exists){
   const orgRef=db.collection("organizations").doc();
   await orgRef.set({name:"Goyal Electrical CRM",createdBy:user.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
   await memberRef.set({organizationId:orgRef.id,role:"admin",email:user.email||"",createdAt:firebase.firestore.FieldValue.serverTimestamp()});
   const companies=orgRef.collection("companies");
   await companies.add({name:"Goyal Electrical",active:true});
   await companies.add({name:"Goyal Enterprises",active:true});
   memberSnap=await memberRef.get();
  }
  const member=memberSnap.data();state.orgId=member.organizationId;state.role=member.role||"sales";
  const co=await db.collection("organizations").doc(state.orgId).collection("companies").where("active","==",true).get();
  state.companies=co.docs.map(d=>({id:d.id,...d.data()}));
  if(!state.companies.length)throw new Error("No companies found in this workspace.");
  state.companyId=state.companies[0].id;
  $("#companySelect").innerHTML=state.companies.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join("");
  $("#companySelect").value=state.companyId;
  $("#authGate").style.display="none";$("#appShell").style.display="flex";
  $("#connectionPill").textContent="FIRESTORE · "+state.role.toUpperCase();
  const chip=$(".user-chip");if(chip){chip.querySelector("strong").textContent=user.email||"Staff";chip.querySelector("small").textContent=state.role.toUpperCase()+" · Cloud workspace"}
  await loadAll();
 }catch(err){authNote("Workspace setup failed: "+err.message,true)}
}
async function loadTable(key){
 let q=companyFilter(db.collection("organizations").doc(state.orgId).collection(TABLES[key]));
 const snap=await q.get();state.data[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
 state.data[key].sort((a,b)=>String(key==="followups"?a.dueAt||"":a.createdAt||"").localeCompare(String(key==="followups"?b.dueAt||"":b.createdAt||"")));
}
async function loadAll(){try{for(const k of Object.keys(TABLES))await loadTable(k);render();toast("Cloud records loaded.")}catch(e){toast("Database error: "+e.message,true)}}
function fmtDate(v){return v?String(v).slice(0,10):"—"}
function table(headers,rows){return '<div class="card table-card"><div class="table-wrap"><table><thead><tr>'+headers.map(x=>"<th>"+x+"</th>").join("")+"</tr></thead><tbody>"+(rows.length?rows.join(""):'<tr><td colspan="'+headers.length+'" class="empty">No cloud records yet. Add your first record.</td></tr>')+"</tbody></table></div></div>"}
function row(cells){return "<tr>"+cells.map(x=>"<td>"+x+"</td>").join("")+"</tr>"}
function actions(k,id){return '<button class="row-action" data-edit="'+k+'" data-id="'+id+'">Edit</button> <button class="row-action" data-delete="'+k+'" data-id="'+id+'">Delete</button>'}
function render(){
 const [title,sub]=titles[state.page];$("#pageName").textContent=title;$("#pageTitle").textContent=title;$("#pageSubtitle").textContent=sub;
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
 $("#companySelect").value=state.companyId;$("#pageContent").innerHTML=pages[state.page]();
}
const pages={
dashboard(){const d=state.data;const pipeline=d.leads.reduce((a,x)=>a+Number(x.estimated_value||0),0);return '<div class="stats">'+[['Active leads',d.leads.filter(x=>!["Won","Lost"].includes(x.stage)).length,"◎"],["Customers",d.customers.length,"♙"],["Pipeline value",money(pipeline),"₹"],["Open follow-ups",d.followups.filter(x=>x.status!=="Completed").length,"◷"]].map(x=>'<div class="card stat"><div class="stat-top"><span>'+x[0]+'</span><span class="stat-icon">'+x[2]+'</span></div><div class="stat-value">'+x[1]+'</div><div class="stat-foot">Live cloud data</div></div>').join("")+'</div><div class="grid-two"><div class="card panel"><div class="panel-head"><h3>Sales pipeline</h3><span class="panel-sub">Leads by stage</span></div><div class="pipeline">'+["New","Contacted","Qualified","Site Visit","Quotation Sent","Negotiation","Won","Lost"].map(s=>{const n=d.leads.filter(x=>x.stage===s).length;return '<div class="stage"><strong>'+n+'</strong><span>'+s+'</span><div class="stage-bar"><i style="width:'+Math.min(100,n*25)+'%"></i></div></div>'}).join("")+'</div></div><div class="card panel"><div class="panel-head"><h3>Upcoming follow-ups</h3></div><div class="activity">'+d.followups.filter(x=>x.status!=="Completed").slice(0,6).map(x=>'<div class="activity-item"><i class="activity-dot"></i><div><strong>'+esc(x.title)+'</strong><small>'+fmtDate(x.due_at)+'</small></div></div>').join("")+'</div></div></div><div class="card panel"><div class="panel-head"><h3>Recent leads</h3><button class="row-action" data-goto="leads">View all →</button></div>'+table(["Business","Contact","Phone","Stage","Potential"],d.leads.slice(0,5).map(x=>row(['<strong>'+esc(x.business_name)+'</strong>',esc(x.contact_person),esc(x.phone),status(x.stage),money(x.estimated_value)])))+'</div>'},
leads(){return '<div class="table-toolbar card"><input class="search" id="searchRows" placeholder="Search leads..."><button class="primary-btn" data-add="leads">＋ Add lead</button></div><div style="height:12px"></div>'+table(["Business","Contact","Phone","Source","Stage","Potential","Actions"],state.data.leads.map(x=>row(['<strong>'+esc(x.business_name)+'</strong>',esc(x.contact_person),esc(x.phone),esc(x.source),status(x.stage),money(x.estimated_value),actions("leads",x.id)])))},
customers(){return '<div class="table-toolbar card"><input class="search" id="searchRows" placeholder="Search customers..."><button class="primary-btn" data-add="customers">＋ Add customer</button></div><div style="height:12px"></div>'+table(["Customer","Contact","Phone","Email","City","Type","Actions"],state.data.customers.map(x=>row(['<strong>'+esc(x.name)+'</strong>',esc(x.contact_person),esc(x.phone),esc(x.email),esc(x.city),esc(x.customer_type),actions("customers",x.id)])))},
followups(){return '<div class="table-toolbar card"><span class="panel-sub">Tasks and reminders</span><button class="primary-btn" data-add="followups">＋ Add follow-up</button></div><div style="height:12px"></div>'+table(["Task","Due","Status","Actions"],state.data.followups.map(x=>row(['<strong>'+esc(x.title)+'</strong>',fmtDate(x.due_at),status(x.status),actions("followups",x.id)])))},
sites(){return '<div class="table-toolbar card"><span class="panel-sub">Site surveys and project activity</span><button class="primary-btn" data-add="sites">＋ Add site</button></div><div style="height:12px"></div>'+table(["Project / Site","Location","Contact","Status","Expected value","Actions"],state.data.sites.map(x=>row(['<strong>'+esc(x.name)+'</strong>',esc(x.location),esc(x.site_contact),status(x.status),money(x.expected_value),actions("sites",x.id)])))},
products(){return '<div class="table-toolbar card"><input class="search" id="searchRows" placeholder="Search products..."><button class="secondary-btn" id="importProductsBtn" type="button">Import Excel</button><input id="productExcelFile" type="file" accept=".xlsx,.xls,.csv" hidden><button class="secondary-btn" data-export="products">Export CSV</button><button class="primary-btn" data-add="products">＋ Add product</button></div><div style="height:12px"></div>'+table(["Product","SKU","Brand","Category","HSN","GST","Price","Actions"],state.data.products.map(x=>row(['<strong>'+esc(x.name)+'</strong>',esc(x.sku),esc(x.brand),esc(x.category),esc(x.hsn),esc(x.gst??18)+'%',money(x.indicative_price),actions("products",x.id)])))},
quotations(){return '<div class="table-toolbar card"><span class="panel-sub">GST quotations and estimates · PDF / WhatsApp ready</span><button class="primary-btn" data-add="quotations">＋ New quotation</button></div><div style="height:12px"></div>'+table(["Quotation","Customer","Date","Valid until","Amount","Status","Actions"],state.data.quotations.map(x=>row(['<strong>'+esc(x.documentNumber||x.quotation_number)+'</strong>',esc(x.customerName),fmtDate(x.documentDate||x.quotation_date),fmtDate(x.validUntil||x.valid_until),money(x.total??x.amount),status(x.status),actions("quotations",x.id)+' <button class="row-action" data-doc-preview="quotations" data-id="'+x.id+'">PDF</button> <button class="row-action" data-share-doc="quotations" data-id="'+x.id+'">WhatsApp</button>'+(x.status==="Accepted"?' <button class="row-action" data-convert-quote="'+x.id+'">Create order</button>':'')])))},
orders(){return '<div class="table-toolbar card"><span class="panel-sub">Customer orders · item details, delivery and order status</span><button class="primary-btn" data-add="orders">＋ Create order</button></div><div style="height:12px"></div>'+table(["Order","Customer","Date","Delivery","Amount","Status","Actions"],state.data.orders.map(x=>row(['<strong>'+esc(x.documentNumber||x.order_number)+'</strong>',esc(x.customerName),fmtDate(x.documentDate||x.order_date),fmtDate(x.deliveryDate||x.validUntil),money(x.total??x.amount),status(x.status),actions("orders",x.id)+' <button class="row-action" data-doc-preview="orders" data-id="'+x.id+'">PDF</button>'])))},
reports(){const d=state.data;return '<div class="stats">'+[['Pipeline',money(d.leads.reduce((a,x)=>a+Number(x.estimated_value||0),0))],["Customers",d.customers.length],["Quotations",d.quotations.length],["Orders",d.orders.length]].map(x=>'<div class="card stat"><div class="stat-top">'+x[0]+'</div><div class="stat-value">'+x[1]+'</div><div class="stat-foot">Live cloud data</div></div>').join("")+'</div><div class="card panel"><h3>Export records</h3>'+Object.keys(TABLES).map(k=>'<button class="secondary-btn" style="margin:4px" data-export="'+k+'">Export '+k+'</button>').join("")+'</div>'},

};
let docItems=[];
function nextDocNumber(type){
 const rows=state.data[type]||[];
 const prefix=type==="quotations"?"EST":"SO";
 const nums=rows.map(x=>Number(String(x[type==="quotations"?"quotation_number":"order_number"]||"").match(/(\d+)$/)?.[1]||0));
 return prefix+"-"+String(Math.max(0,...nums)+1).padStart(4,"0");
}
function docDate(d){return new Date(d||Date.now()).toISOString().slice(0,10)}
function documentForm(type,id){
 editing={type,id:id||null};
 const rec=id?state.data[type].find(x=>x.id===id)||{}:{};
 docItems=Array.isArray(rec.items)?JSON.parse(JSON.stringify(rec.items)):[{name:"",description:"",hsn:"",qty:1,unit:"Nos",rate:0,gst:18}];
 const isQuote=type==="quotations", label=isQuote?"Quotation":"Sales order";
 const customerOptions=state.data.customers.map(x=>'<option value="'+esc(x.id)+'" '+(rec.customerId===x.id?"selected":"")+'>'+esc(x.name)+'</option>').join("");
 $("#dialogTitle").textContent=(id?"Edit ":"New ")+label;
 $("#dialogFields").innerHTML='<div class="document-editor">'+
 '<div class="doc-actions"><button type="button" class="secondary-btn" data-doc-preview>Preview / PDF</button><button type="button" class="secondary-btn" data-doc-whatsapp>WhatsApp</button></div>'+
 '<section class="doc-card"><h3>Bill to</h3><div class="doc-grid"><div class="field"><label>Select customer</label><select name="customerId" id="docCustomer"><option value="">Select customer…</option>'+customerOptions+'</select></div><div class="field"><label>Customer / company name *</label><input name="customerName" required value="'+esc(rec.customerName||"")+'" placeholder="Enter customer name"></div><div class="field"><label>GSTIN</label><input name="gstin" value="'+esc(rec.gstin||"")+'" placeholder="Optional for B2B"></div><div class="field"><label>Phone / WhatsApp</label><input name="phone" value="'+esc(rec.phone||"")+'" placeholder="+91"></div><div class="field"><label>Email</label><input name="email" type="email" value="'+esc(rec.email||"")+'" placeholder="Optional"></div><div class="field full"><label>Billing address</label><textarea name="billingAddress" placeholder="Street, city, PIN code">'+esc(rec.billingAddress||"")+'</textarea></div></div></section>'+
 '<section class="doc-card"><h3>'+label+' details</h3><div class="doc-grid"><div class="field"><label>'+label+' number *</label><input name="documentNumber" required value="'+esc(rec.documentNumber||rec.quotation_number||rec.order_number||nextDocNumber(type))+'"></div><div class="field"><label>Date</label><input name="documentDate" type="date" value="'+esc(rec.documentDate||rec.quotation_date||rec.order_date||docDate())+'"></div><div class="field"><label>'+(isQuote?"Valid until":"Expected delivery date")+'</label><input name="validUntil" type="date" value="'+esc(rec.validUntil||rec.valid_until||rec.deliveryDate||"")+'"></div><div class="field"><label>Place of supply (state)</label><select name="placeOfSupply" id="docState">'+["Punjab","Haryana","Delhi","Chandigarh","Rajasthan","Himachal Pradesh","Jammu and Kashmir","Uttar Pradesh","Maharashtra","Gujarat","Other"].map(s=>'<option '+((rec.placeOfSupply||"Punjab")===s?"selected":"")+'>'+s+'</option>').join("")+'</select></div><div class="field"><label>Supply type</label><select name="supplyType"><option value="Regular" '+((rec.supplyType||"Regular")==="Regular"?"selected":"")+'>Regular (domestic)</option><option value="SEZ">SEZ</option><option value="Export">Export</option></select></div><div class="field"><label>Status</label><select name="status">'+(isQuote?["Draft","Sent","Accepted","Rejected","Expired"]:["Draft","Pending","Confirmed","In progress","Partially delivered","Completed","Cancelled"]).map(s=>'<option '+((rec.status||(isQuote?"Draft":"Pending"))===s?"selected":"")+'>'+s+'</option>').join("")+'</select></div></div>'+
 '<div class="doc-switches"><label><input type="checkbox" name="chargeGst" '+(rec.chargeGst!==false?"checked":"")+'> Charge GST</label><label><input type="checkbox" name="pricesIncludeGst" '+(rec.pricesIncludeGst?"checked":"")+'> Rates include GST</label><label><input type="checkbox" name="roundOff" '+(rec.roundOff!==false?"checked":"")+'> Round off total</label></div></section>'+
 '<section class="doc-card"><h3>Items</h3><div class="doc-items-head"><span>Item / description</span><span>HSN/SAC</span><span>Qty</span><span>Rate ₹</span><span>GST %</span><span></span></div><div id="docItems"></div><button type="button" class="secondary-btn" data-doc-addline>＋ Add line</button>'+
 '<div class="doc-grid doc-discounts"><div class="field"><label>Discount type</label><select name="discountType"><option value="percent" '+((rec.discountType||"percent")==="percent"?"selected":"")+'>Percentage (%)</option><option value="amount" '+(rec.discountType==="amount"?"selected":"")+'>Amount (₹)</option></select></div><div class="field"><label>Discount</label><input name="discountValue" type="number" min="0" step="0.01" value="'+esc(rec.discountValue||0)+'"></div><div class="field"><label>Additional charges (₹)</label><input name="extraCharges" type="number" min="0" step="0.01" value="'+esc(rec.extraCharges||0)+'" placeholder="Freight / packing"></div></div><div id="docTotals" class="doc-totals"></div></section>'+
 '<section class="doc-card"><div class="field"><label>Notes</label><textarea name="notes">'+esc(rec.notes||"Thank you for your business!")+'</textarea></div><div class="field"><label>Terms & conditions</label><textarea name="terms">'+esc(rec.terms||(isQuote?"This quotation is valid until the date mentioned above. Prices are subject to change after the validity period.":"Please verify goods and quantities at delivery. Payment as per agreed terms."))+'</textarea></div></section></div>';
 renderDocItems();
 const f=$("#dialogFields");
 f.querySelector("#docCustomer").addEventListener("change",e=>{
  const x=state.data.customers.find(c=>c.id===e.target.value);if(!x)return;
  f.querySelector('[name="customerName"]').value=x.name||"";
  f.querySelector('[name="gstin"]').value=x.gstin||"";
  f.querySelector('[name="phone"]').value=x.phone||"";
  f.querySelector('[name="email"]').value=x.email||"";
  f.querySelector('[name="billingAddress"]').value=x.address||"";
 });
 f.querySelectorAll('input[name="chargeGst"],input[name="pricesIncludeGst"],input[name="roundOff"],input[name="discountValue"],input[name="extraCharges"],select[name="discountType"],select[name="placeOfSupply"]').forEach(el=>el.addEventListener("change",renderDocTotals));
 f.querySelectorAll('input[name="discountValue"],input[name="extraCharges"]').forEach(el=>el.addEventListener("input",renderDocTotals));
 $("#recordDialog").showModal();
}
function renderDocItems(){
 const host=$("#docItems");if(!host)return;
 host.innerHTML=docItems.map((it,i)=>'<div class="doc-item-row" data-item="'+i+'"><select data-product-pick aria-label="Pick product"><option value="">Select from product list…</option>'+state.data.products.map(p=>'<option value="'+esc(p.id)+'" '+(it.productId===p.id?"selected":"")+' >'+esc((p.sku?p.sku+" · ":"")+p.name)+'</option>').join("")+'</select><input data-k="name" value="'+esc(it.name)+'" placeholder="Item or service name"><input data-k="hsn" value="'+esc(it.hsn)+'" placeholder="HSN/SAC"><input data-k="qty" type="number" min="0" step="0.01" value="'+esc(it.qty??1)+'" aria-label="Quantity"><input data-k="rate" type="number" min="0" step="0.01" value="'+esc(it.rate??0)+'" aria-label="Rate"><select data-k="gst" aria-label="GST">'+[0,5,12,18,28].map(v=>'<option value="'+v+'" '+(Number(it.gst??18)===v?"selected":"")+'>'+v+'%</option>').join("")+'</select><button type="button" class="row-action" data-doc-remove="'+i+'">✕</button><input class="doc-description" data-k="description" value="'+esc(it.description)+'" placeholder="Description (optional)"></div>').join("");
 host.querySelectorAll("[data-product-pick]").forEach(el=>el.addEventListener("change",()=>{const row=el.closest("[data-item]");const i=Number(row.dataset.item);const p=state.data.products.find(x=>x.id===el.value);if(!p)return;Object.assign(docItems[i],{productId:p.id,name:p.name||"",hsn:p.hsn||"",unit:p.unit||"Nos",rate:Number(p.indicative_price)||0,gst:Number(p.gst??18)});renderDocItems()}));
 host.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",()=>{if(el.hasAttribute("data-product-pick"))return;const row=el.closest("[data-item]");const i=Number(row.dataset.item);const k=el.dataset.k;docItems[i][k]=["qty","rate","gst"].includes(k)?Number(el.value||0):el.value;renderDocTotals()}));
 renderDocTotals();
}
function calculateDoc(){
 const form=$("#recordForm");const v=n=>form.elements[n]?.value;
 const checked=n=>!!form.elements[n]?.checked;
 const subtotal=docItems.reduce((a,x)=>a+Math.max(0,Number(x.qty)||0)*Math.max(0,Number(x.rate)||0),0);
 const discountRaw=Math.max(0,Number(v("discountValue"))||0);
 const discount=Math.min(subtotal,v("discountType")==="percent"?subtotal*discountRaw/100:discountRaw);
 const taxable=Math.max(0,subtotal-discount)+Math.max(0,Number(v("extraCharges"))||0);
 const charge=checked("chargeGst");
 const itemTax=charge?docItems.reduce((a,x)=>{const line=Math.max(0,Number(x.qty)||0)*Math.max(0,Number(x.rate)||0);const share=subtotal?line/subtotal:0;const net=Math.max(0,line-discount*share);const base=checked("pricesIncludeGst")?net/(1+Number(x.gst||0)/100):net;return a+(checked("pricesIncludeGst")?net-base:base*Number(x.gst||0)/100)},0):0;
 const extraTax=charge&&Number(v("extraCharges"))>0?Number(v("extraCharges"))*.18:0;
 const tax=itemTax+extraTax;
 const baseTaxable=checked("pricesIncludeGst")?taxable-itemTax:taxable;
 let total=baseTaxable+tax;
 if(checked("roundOff"))total=Math.round(total);
 return {subtotal,discount,taxable:baseTaxable,tax,total,roundOff:checked("roundOff"),gst:charge,extraCharges:Number(v("extraCharges"))||0};
}
function renderDocTotals(){
 const host=$("#docTotals");if(!host)return;const t=calculateDoc();const stateName=$("#recordForm").elements.placeOfSupply.value;
 const local=stateName==="Punjab";
 host.innerHTML='<div><span>Subtotal</span><b>'+money(t.subtotal)+'</b></div><div><span>Discount</span><b>− '+money(t.discount)+'</b></div><div><span>Taxable value</span><b>'+money(t.taxable)+'</b></div><div><span>'+(t.gst?(local?"CGST + SGST / IGST":"IGST"):"GST")+'</span><b>'+money(t.tax)+'</b></div><div><span>Additional charges</span><b>'+money(t.extraCharges)+'</b></div><div class="doc-grand"><span>Grand total</span><b>'+money(t.total)+'</b></div><small>GST estimate only. Verify HSN and applicable tax rates before issuing a tax document.</small>';
}
function openForm(type,id){
 if(type==="quotations"||type==="orders"){documentForm(type,id);return}
 const rec=id?state.data[type].find(x=>x.id===id):{};
 editing={type,id:id||null};
 $("#dialogTitle").textContent=(id?"Edit ":"Add ")+(labels[type]||type);
 $("#dialogFields").innerHTML=fields[type].map(([key,label,kind,extra])=>{
  const value=rec[key]??(kind==="date"?new Date().toISOString().slice(0,10):"");
  let control="";
  if(kind==="select")control='<select name="'+key+'">'+extra.split("|").map(v=>'<option value="'+v+'" '+(value===v?"selected":"")+'>'+v.replaceAll("_"," ")+'</option>').join("")+'</select>';
  else if(kind==="textarea")control='<textarea name="'+key+'">'+esc(value)+'</textarea>';
  else control='<input name="'+key+'" type="'+kind+'" value="'+esc(value)+'" '+(extra===1?"required":"")+'>';
  return '<div class="field '+(kind==="textarea"?"full":"")+'"><label>'+label+'</label>'+control+'</div>';
 }).join("");
 $("#recordDialog").showModal();
}
$("#recordForm").addEventListener("submit",saveRecord);
async function saveRecord(e){
 e.preventDefault();if(!editing)return;const btn=$("#saveRecord");btn.disabled=true;
 try{
  const type=editing.type,obj=Object.fromEntries(new FormData(e.currentTarget));
  if(type==="quotations"||type==="orders"){
   const form=e.currentTarget, val=n=>form.elements[n]?.value||"";
   const checked=n=>!!form.elements[n]?.checked;
   const totals=calculateDoc();
   Object.assign(obj,{documentNumber:val("documentNumber"),documentDate:val("documentDate"),customerId:val("customerId"),customerName:val("customerName"),gstin:val("gstin"),phone:val("phone"),email:val("email"),billingAddress:val("billingAddress"),validUntil:val("validUntil"),deliveryDate:val("validUntil"),placeOfSupply:val("placeOfSupply"),supplyType:val("supplyType"),status:val("status"),chargeGst:checked("chargeGst"),pricesIncludeGst:checked("pricesIncludeGst"),roundOff:checked("roundOff"),items:docItems.map(x=>({...x,qty:Number(x.qty)||0,rate:Number(x.rate)||0,gst:Number(x.gst)||0})),discountType:val("discountType"),discountValue:Number(val("discountValue"))||0,extraCharges:Number(val("extraCharges"))||0,notes:val("notes"),terms:val("terms"),...totals});
   if(type==="quotations"){obj.quotation_number=obj.documentNumber;obj.quotation_date=obj.documentDate;obj.valid_until=obj.validUntil;obj.amount=totals.total}
   else{obj.order_number=obj.documentNumber;obj.order_date=obj.documentDate;obj.amount=totals.total}
  }else{
   for(const [k,v] of Object.entries(obj))if(v==="")obj[k]=null;
   for(const k of ["estimated_value","expected_value","indicative_price","amount","minimum_stock","gst"])if(obj[k]!==undefined)obj[k]=Number(obj[k]||0);
  }
  obj.companyId=state.companyId;obj.createdAt=editing.id?(state.data[type].find(x=>x.id===editing.id)?.createdAt||new Date().toISOString()):new Date().toISOString();obj.updatedAt=new Date().toISOString();
  const ref=db.collection("organizations").doc(state.orgId).collection(TABLES[type]);
  if(editing.id)await ref.doc(editing.id).update(obj);else await ref.add(obj);
  $("#recordDialog").close();await loadTable(type);render();toast("Saved to Firestore successfully.");
 }catch(err){toast("Save failed: "+err.message,true)}finally{btn.disabled=false}
}
async function deleteRecord(type,id){if(!confirm("Delete this "+labels[type]+" record?"))return;try{await db.collection("organizations").doc(state.orgId).collection(TABLES[type]).doc(id).delete();await loadTable(type);render();toast("Record deleted.")}catch(e){toast("Delete failed: "+e.message,true)}}
function documentPrint(type,record){
 const quote=type==="quotations", title=quote?"QUOTATION / ESTIMATE":"SALES ORDER";
 const lines=(record.items||[]).map((x,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(x.name)+'</b><br>'+esc(x.description)+'</td><td>'+esc(x.hsn)+'</td><td>'+Number(x.qty||0)+' '+esc(x.unit||"")+'</td><td>'+money(x.rate)+'</td><td>'+Number(x.gst||0)+'%</td><td>'+money(Number(x.qty||0)*Number(x.rate||0))+'</td></tr>').join("");
 const html='<!doctype html><html><head><meta charset="utf-8"><title>'+title+' '+esc(record.documentNumber)+'</title><style>body{font:14px Arial,sans-serif;color:#182b3c;margin:32px}header{display:flex;justify-content:space-between;border-bottom:3px solid #1769aa;padding-bottom:18px}h1{font-size:22px;color:#102b46;margin:0}h2{font-size:18px;margin:25px 0 8px}small{color:#68798a}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:20px 0}.box{border:1px solid #dce4ec;padding:14px;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{padding:10px;border:1px solid #dce4ec;text-align:left;font-size:12px}th{background:#f1f5f9}.totals{margin:18px 0 18px auto;width:300px}.totals div{display:flex;justify-content:space-between;padding:5px}.grand{font-size:19px;font-weight:bold;color:#1769aa;border-top:2px solid #1769aa}.terms{white-space:pre-wrap}.print{padding:10px 16px;background:#1769aa;color:white;border:0;border-radius:6px}@media print{.print{display:none}body{margin:12mm}}</style></head><body><button class="print" onclick="window.print()">Print / Save PDF</button><header><div><h1>GOYAL ELECTRICAL</h1><b>Authorised Dealer – Havells India Ltd, TRENZLITE, Orient Plum, APAR Wire</b><p>Street No. 10A, Ajit Road, Bathinda, Punjab<br>9417753423 | 9815473737 · Goyalelectricalbti@gmail.com</p></div><div><h1>'+title+'</h1><b>'+esc(record.documentNumber||"")+'</b><p>Date: '+esc(fmtDate(record.documentDate))+'<br>'+(quote?"Valid until: ":"Delivery: ")+esc(fmtDate(record.validUntil||record.deliveryDate))+'</p></div></header><div class="meta"><div class="box"><b>Bill to</b><p>'+esc(record.customerName)+'</p>'+esc(record.billingAddress)+'<p>GSTIN: '+esc(record.gstin)+'<br>Phone: '+esc(record.phone)+'</p></div><div class="box"><b>Document details</b><p>Place of supply: '+esc(record.placeOfSupply)+'<br>Supply type: '+esc(record.supplyType)+'<br>Status: '+esc(record.status)+'</p></div></div><h2>Items</h2><table><thead><tr><th>#</th><th>Item / Description</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr></thead><tbody>'+lines+'</tbody></table><div class="totals"><div><span>Subtotal</span><b>'+money(record.subtotal)+'</b></div><div><span>Discount</span><b>'+money(record.discount)+'</b></div><div><span>Taxable value</span><b>'+money(record.taxable)+'</b></div><div><span>GST</span><b>'+money(record.tax)+'</b></div><div><span>Additional charges</span><b>'+money(record.extraCharges)+'</b></div><div class="grand"><span>Grand total</span><b>'+money(record.total??record.amount)+'</b></div></div><div class="box"><b>Notes</b><p>'+esc(record.notes)+'</p><b>Terms & conditions</b><p class="terms">'+esc(record.terms)+'</p></div><p style="margin-top:35px;text-align:right">For GOYAL ELECTRICAL<br><br><br>Authorised Signatory</p></body></html>';
 const w=window.open("","_blank");if(!w){toast("Allow pop-ups to preview or print the document.",true);return}w.document.write(html);w.document.close();
}
function buildDocumentPdf(type,record){
 // Self-contained PDF writer: no third-party PDF CDN is required.
 const quote=type==="quotations",title=quote?"QUOTATION / ESTIMATE":"SALES ORDER";
 const ascii=v=>String(v??"").normalize("NFKD").replace(/[^\x20-\x7E]/g," ").replace(/\\s+/g," ").trim();
 const fmt=v=>"INR "+Number(v||0).toFixed(2);
 const lines=[];
 const add=(v="")=>{const t=ascii(v);if(!t){lines.push("");return;}for(let i=0;i<t.length;i+=92)lines.push(t.slice(i,i+92));};
 add("GOYAL ELECTRICAL");add("Authorised Dealer - Havells India Ltd, TRENZLITE, Orient Plum, APAR Wire");
 add("Street No. 10A, Ajit Road, Bathinda, Punjab | 9417753423 | 9815473737");
 add("Goyalelectricalbti@gmail.com");add("--------------------------------------------------------------------------");
 add(title+"     Document No: "+(record.documentNumber||record.quotation_number||record.order_number||""));
 add("Date: "+(record.documentDate||record.quotation_date||record.order_date||"")+"     "+(quote?"Valid until: ":"Expected delivery: ")+(record.validUntil||record.deliveryDate||""));
 add("BILL TO: "+(record.customerName||""));add("Address: "+(record.billingAddress||""));
 add("Phone: "+(record.phone||"")+"     GSTIN: "+(record.gstin||""));
 add("Place of supply: "+(record.placeOfSupply||"")+"     Supply type: "+(record.supplyType||""));
 add("");add("ITEM / DESCRIPTION | HSN | QTY | RATE | GST | AMOUNT");add("--------------------------------------------------------------------------");
 (record.items||[]).forEach((it,i)=>{
  add((i+1)+". "+(it.name||"")+" | HSN: "+(it.hsn||"-")+" | Qty: "+(it.qty??0)+" "+(it.unit||""));
  if(it.description)add("   "+it.description);
  add("   Rate: "+fmt(it.rate)+" | GST: "+(it.gst??0)+"% | Amount: "+fmt(Number(it.qty||0)*Number(it.rate||0)));
 });
 add("--------------------------------------------------------------------------");add("Subtotal: "+fmt(record.subtotal));add("Discount: "+fmt(record.discount));
 add("Taxable value: "+fmt(record.taxable));add("GST: "+fmt(record.tax));add("Additional charges: "+fmt(record.extraCharges));
 add("GRAND TOTAL: "+fmt(record.total??record.amount));add("");add("Notes: "+(record.notes||""));
 add("Terms & conditions: "+(record.terms||""));add("");add("For GOYAL ELECTRICAL");add("Authorised Signatory");
 const pageLines=[];for(let i=0;i<lines.length;i+=48)pageLines.push(lines.slice(i,i+48));
 const objects=[];const addObj=v=>{objects.push(v);return objects.length;};
 const catalogId=addObj("");const pagesId=addObj("");
 const fontId=addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
 const pageIds=[];
 pageLines.forEach((pageLinesForPage)=>{
  let stream="BT /F1 9 Tf 48 790 Td 12 TL ";
  pageLinesForPage.forEach((ln,i)=>{stream+="("+ascii(ln).replace(/([\\\\()])/g,"\\\\$1")+") Tj T* ";});
  stream+="ET";
  const contentId=addObj("<< /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream");
  const pageId=addObj("<< /Type /Page /Parent "+pagesId+" 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 "+fontId+" 0 R >> >> /Contents "+contentId+" 0 R >>");
  pageIds.push(pageId);
 });
 objects[catalogId-1]="<< /Type /Catalog /Pages "+pagesId+" 0 R >>";
 objects[pagesId-1]="<< /Type /Pages /Kids ["+pageIds.map(x=>x+" 0 R").join(" ")+"] /Count "+pageIds.length+" >>";
 let pdf="%PDF-1.4\n";const offsets=[0];
 objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=(i+1)+" 0 obj\n"+obj+"\nendobj\n";});
 const xref=pdf.length;pdf+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 pdf+="trailer\n<< /Size "+(objects.length+1)+" /Root "+catalogId+" 0 R >>\nstartxref\n"+xref+"\n%%EOF";
 return new Blob([pdf],{type:"application/pdf"});
}
async function shareDocument(type,id){
 const rec=state.data[type].find(x=>x.id===id);if(!rec)return;
 const num=rec.documentNumber||rec.quotation_number||rec.order_number||"document";
 const title=(type==="quotations"?"Quotation ":"Sales Order ")+num;
 const msg=title+" from GOYAL ELECTRICAL. Customer: "+(rec.customerName||"")+". Total: "+money(rec.total??rec.amount)+".";
 try{
  toast("Preparing PDF for sharing…");
  const blob=buildDocumentPdf(type,rec);
  const file=new File([blob],title.replace(/[^a-z0-9-_ ]/gi,"").replace(/\s+/g,"_")+".pdf",{type:"application/pdf"});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
   await navigator.share({files:[file],title,text:msg});
   toast("PDF shared. Choose WhatsApp in the Android share sheet.");
   return;
  }
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=file.name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  const phone=String(rec.phone||"").replace(/\D/g,"");
  window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg)," _blank".trim());
  toast("PDF downloaded. Attach it in WhatsApp before sending.");
 }catch(err){if(err.name==="AbortError"){toast("Sharing cancelled.");return;}toast("PDF sharing failed: "+err.message,true);}
}
async function convertQuote(id){
 const q=state.data.quotations.find(x=>x.id===id);if(!q)return;
 if(!confirm("Create a sales order using this quotation's customer and item details?"))return;
 const obj={...q,documentNumber:nextDocNumber("orders"),order_number:nextDocNumber("orders"),documentDate:docDate(),order_date:docDate(),status:"Pending",sourceQuotationId:id,companyId:state.companyId,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 delete obj.id;delete obj.quotation_number;delete obj.quotation_date;delete obj.valid_until;
 try{await db.collection("organizations").doc(state.orgId).collection("orders").add(obj);await loadTable("orders");toast("Sales order created from quotation.");state.page="orders";render()}catch(e){toast("Could not convert quotation: "+e.message,true)}
}
async function importProductsExcel(file){
 try{
  if(!window.XLSX)throw new Error("Excel reader did not load. Refresh the page and retry.");
  const data=new Uint8Array(await file.arrayBuffer());
  const wb=XLSX.read(data,{type:"array"});
  const ws=wb.Sheets["Products"]||wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
  if(!rows.length)throw new Error("No product rows found in the Products sheet.");
  const norm=v=>String(v??"").trim();
  const pick=(r,...keys)=>{for(const k of keys)if(r[k]!==undefined&&r[k]!=="")return r[k];return ""};
  const coll=db.collection("organizations").doc(state.orgId).collection("products");
  let added=0,updated=0,skipped=0;
  for(const r of rows){
   const name=norm(pick(r,"Product Name","name","Name"));
   if(!name||name.toLowerCase().startsWith("example:")){skipped++;continue}
   const sku=norm(pick(r,"SKU / Item Code","SKU","sku"));
   const obj={name,sku,brand:norm(pick(r,"Brand","brand")),category:norm(pick(r,"Category","category")),unit:norm(pick(r,"Unit","unit"))||"Nos",hsn:norm(pick(r,"HSN / SAC","HSN","hsn")),gst:Number(pick(r,"GST %","GST","gst")||18),indicative_price:Number(pick(r,"Selling Rate (INR)","Indicative Price","indicative_price","Rate")||0),minimum_stock:Number(pick(r,"Minimum Stock","minimum_stock")||0),description:norm(pick(r,"Description","description")),companyId:state.companyId,updatedAt:new Date().toISOString()};
   if(!Number.isFinite(obj.gst)||![0,5,12,18,28].includes(obj.gst)||!Number.isFinite(obj.indicative_price)||!Number.isFinite(obj.minimum_stock)){skipped++;continue}
   if(sku){
    const existing=await coll.where("companyId","==",state.companyId).where("sku","==",sku).limit(1).get();
    if(!existing.empty){await existing.docs[0].ref.update(obj);updated++;continue}
   }
   obj.createdAt=new Date().toISOString();await coll.add(obj);added++;
  }
  await loadTable("products");render();toast("Product import complete: "+added+" added, "+updated+" updated, "+skipped+" skipped.");
 }catch(err){toast("Excel import failed: "+err.message,true)}
 finally{const el=$("#productExcelFile");if(el)el.value=""}
}
function exportCsv(key){const rows=state.data[key]||[];if(!rows.length){toast("No records to export.");return}const cols=Object.keys(rows[0]);const csv=[cols.join(","),...rows.map(o=>cols.map(k=>'"'+String(o[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="goyal-crm-"+key+".csv";a.click();URL.revokeObjectURL(url)}
document.addEventListener("click",async e=>{const p=e.target.closest("[data-page]");if(p){state.page=p.dataset.page;render()}const a=e.target.closest("[data-add]");if(a)openForm(a.dataset.add);const ed=e.target.closest("[data-edit]");if(ed)openForm(ed.dataset.edit,ed.dataset.id);const del=e.target.closest("[data-delete]");if(del)deleteRecord(del.dataset.delete,del.dataset.id);const go=e.target.closest("[data-goto]");if(go){state.page=go.dataset.goto;render()}const ex=e.target.closest("[data-export]");if(ex)exportCsv(ex.dataset.export);const importBtn=e.target.closest("#importProductsBtn");if(importBtn)$("#productExcelFile").click();const addLine=e.target.closest("[data-doc-addline]");if(addLine){docItems.push({name:"",description:"",hsn:"",qty:1,unit:"Nos",rate:0,gst:18});renderDocItems()}const remove=e.target.closest("[data-doc-remove]");if(remove){docItems.splice(Number(remove.dataset.docRemove),1);renderDocItems()}const preview=e.target.closest("[data-doc-preview]");if(preview){const type=preview.dataset.docPreview||editing?.type;const id=preview.dataset.id||editing?.id;if(id){const rec=state.data[type].find(x=>x.id===id);if(rec)documentPrint(type,rec)}else if(editing){const form=$("#recordForm");const v=n=>form.elements[n]?.value||"";const temp={...Object.fromEntries(new FormData(form)),...calculateDoc(),items:docItems,documentNumber:v("documentNumber"),documentDate:v("documentDate"),customerName:v("customerName"),billingAddress:v("billingAddress"),phone:v("phone"),gstin:v("gstin"),placeOfSupply:v("placeOfSupply"),status:v("status"),notes:v("notes"),terms:v("terms")};documentPrint(editing.type,temp)}}const wa=e.target.closest("[data-doc-whatsapp]");if(wa&&editing?.id)shareDocument(editing.type,editing.id);const share=e.target.closest("[data-share-doc]");if(share)shareDocument(share.dataset.shareDoc,share.dataset.id);const conv=e.target.closest("[data-convert-quote]");if(conv)convertQuote(conv.dataset.convertQuote)});
function closeMobileSidebar(){
 const sidebar=document.querySelector(".sidebar");
 if(sidebar)sidebar.classList.remove("open");
 $("#mobileMenu")?.setAttribute("aria-expanded","false");
}
function toggleMobileSidebar(){
 const sidebar=document.querySelector(".sidebar");
 if(!sidebar)return;
 const isOpen=sidebar.classList.toggle("open");
 $("#mobileMenu")?.setAttribute("aria-expanded",String(isOpen));
}
$("#navigation").addEventListener("click",e=>{
 if(e.target.closest("[data-page]"))closeMobileSidebar();
});
$("#mobileMenu").addEventListener("click",e=>{
 e.stopPropagation();
 toggleMobileSidebar();
});
document.addEventListener("click",e=>{
 const sidebar=document.querySelector(".sidebar");
 if(sidebar?.classList.contains("open")&&!sidebar.contains(e.target)&&!e.target.closest("#mobileMenu"))closeMobileSidebar();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMobileSidebar();});
$("#quickAdd").onclick=()=>openForm(({dashboard:"leads",leads:"leads",customers:"customers",followups:"followups",sites:"sites",products:"products",quotations:"quotations",orders:"orders"}[state.page]||"leads"));
$("#companySelect").onchange=async e=>{state.companyId=e.target.value;await loadAll()};
document.addEventListener("change",async e=>{if(e.target.id==="productExcelFile"&&e.target.files?.[0])await importProductsExcel(e.target.files[0]);});
document.addEventListener("input",e=>{if(e.target.id==="searchRows"){const q=e.target.value.toLowerCase();document.querySelectorAll("#pageContent tbody tr").forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none")}});
$("#signOutBtn").addEventListener("click",async()=>{if(auth)await auth.signOut();location.reload()});
if(auth){auth.onAuthStateChanged(user=>{if(user)startWorkspace(user)})}else{authNote("Firebase SDK did not load. Check your internet connection and refresh.",true)}

/* GOYAL ELECTRICAL CRM — Supabase-backed application */
const $=s=>document.querySelector(s);
const SUPABASE_URL="https://qimayftlfeoxoifysxil.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_Xte3mnQUztOUdN6LAzCiPw_7-77IxI3";
const sb=window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY) : null;
const TABLES={leads:"leads",customers:"customers",followups:"followups",sites:"sites",products:"products",quotations:"quotations",orders:"sales_orders"};
const state={page:"dashboard",orgId:null,role:null,user:null,companyId:"",companies:[],data:{leads:[],customers:[],followups:[],sites:[],products:[],quotations:[],orders:[]}};
let editing=null,authMode="signin";
const titles={dashboard:["Dashboard","Live business overview"],leads:["Leads & Pipeline","Track prospects from first contact to conversion."],customers:["Customers","Your customer directory"],followups:["Follow-ups & Tasks","Never miss a customer commitment."],sites:["Sites & Projects","Manage site visits and project progress."],products:["Products","Product catalogue and indicative pricing."],quotations:["Quotations","Prepare and track customer quotations."],orders:["Sales Orders","Manage customer orders independently in your CRM."],reports:["Reports","Review pipeline and export business records."]};
const fields={
leads:[["business_name","Business name","text",1],["contact_person","Contact person","text"],["phone","Phone","tel"],["email","Email","email"],["source","Lead source","text"],["stage","Pipeline stage","select","New|Contacted|Qualified|Site Visit|Quotation Sent|Negotiation|Won|Lost"],["estimated_value","Potential value (₹)","number"],["next_follow_up","Next follow-up","date"]],
customers:[["name","Customer name","text",1],["contact_person","Contact person","text"],["phone","Phone","tel"],["email","Email","email"],["city","City","text"],["customer_type","Customer type","select","Retail|Contractor|Builder|Dealer|Corporate|Other"],["address","Address","text"],["notes","Notes","textarea"]],
followups:[["title","Task / follow-up","text",1],["due_at","Due date","date"],["assigned_to","Assigned user ID (optional)","text"],["status","Status","select","Pending|Completed|Rescheduled"],["notes","Notes","textarea"]],
sites:[["name","Project / site name","text",1],["location","Location","text"],["status","Status","select","New|Survey required|Scheduled|In progress|On hold|Completed"],["site_contact","Site contact","text"],["expected_value","Expected value (₹)","number"],["notes","Notes","textarea"]],
products:[["name","Product name","text",1],["sku","SKU / item code","text"],["brand","Brand","select","Havells|Orient Plum|TRENZLITE|APAR|Other"],["category","Category","text"],["unit","Unit","text"],["indicative_price","Indicative price (₹)","number"],["minimum_stock","Minimum stock","number"]],
quotations:[["quotation_number","Quotation number","text",1],["quotation_date","Quotation date","date"],["valid_until","Valid until","date"],["amount","Total amount (₹)","number"],["status","Status","select","Draft|Sent|Accepted|Rejected|Expired"],["notes","Notes","textarea"]],
orders:[["order_number","Order number","text",1],["order_date","Order date","date"],["amount","Total amount (₹)","number"],["status","Order status","select","Pending|Confirmed|In progress|Completed|Cancelled"],["notes","Notes","textarea"]]
};
const labels={leads:"lead",customers:"customer",followups:"follow-up",sites:"site/project",products:"product",quotations:"quotation",orders:"sales order"};
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(v){return "₹"+Number(v||0).toLocaleString("en-IN")}
function toast(s,bad=false){const t=$("#toast");t.textContent=s;t.style.background=bad?"#8b2525":"#142f49";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3200)}
function status(s){const v=String(s||"—");const cls=["Won","Completed","Accepted","posted"].includes(v)?"green":["Pending","New","Quotation Sent","pending_review","Draft"].includes(v)?"amber":["Lost","Rejected","failed","Cancelled"].includes(v)?"red":"";return '<span class="status '+cls+'">'+esc(v.replaceAll("_"," "))+"</span>"}
function companyFilter(q){return q.eq("organization_id",state.orgId).eq("company_id",state.companyId||null)}
function authNote(msg,error=false){const n=$("#authFeedback");if(n){n.textContent=msg;n.classList.toggle("error",error)}}
function authModeRender(){ $("#authTitle").textContent=authMode==="signin"?"Sign in to your CRM":"Create staff account";$("#authSubmit").textContent=authMode==="signin"?"Sign in":"Create account";$("#authToggle").textContent=authMode==="signin"?"Need an account? Create staff account":"Already registered? Sign in";authNote("")}
$("#authToggle").addEventListener("click",()=>{authMode=authMode==="signin"?"signup":"signin";authModeRender()});
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();if(!sb){authNote("The sign-in service did not load. Check your internet connection, refresh this page, and try again.",true);return}const btn=$("#authSubmit");btn.disabled=true;authNote("Please wait…");try{const email=$("#authEmail").value.trim(),password=$("#authPassword").value;const res=authMode==="signin"?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});if(res.error)throw res.error;if(authMode==="signup"&&!res.data.session){authNote("Account created. Confirm your email, then sign in. Ask the administrator to add your staff role.");return}await startWorkspace(res.data.user)}catch(err){authNote(err.message||"Could not sign in.",true)}finally{btn.disabled=false}});
$("#authToggle").addEventListener("keydown",()=>{});
async function startWorkspace(user){
 state.user=user;authNote("Checking organization access…");
 const {data:members,error}=await sb.from("organization_members").select("organization_id,role").eq("user_id",user.id).limit(1);
 if(error){authNote("Database setup incomplete: "+error.message,true);return}
 if(!members?.length){authNote("Login succeeded, but this account has no CRM organization role. The first administrator must run bootstrap_first_admin.sql; other staff must be invited by an administrator.",true);return}
 state.orgId=members[0].organization_id;state.role=members[0].role;
 const {data:co,error:ce}=await sb.from("crm_companies").select("id,name").eq("organization_id",state.orgId).eq("is_active",true).order("name");
 if(ce){authNote("Could not load company list: "+ce.message,true);return}
 state.companies=co||[];
 if(!state.companies.length){authNote("No CRM companies configured. Ask the administrator to add a company.",true);return}
 state.companyId=state.companies[0].id;
 $("#companySelect").innerHTML=state.companies.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join("");
 $("#companySelect").value=state.companyId;
 $("#authGate").style.display="none";$("#appShell").style.display="flex";
 $("#connectionPill").textContent="CLOUD DATABASE · "+state.role.toUpperCase();
 const chip=$(".user-chip");if(chip){chip.querySelector("strong").textContent=user.email||"Staff";chip.querySelector("small").textContent=state.role.toUpperCase()+" · Cloud workspace"}
 await loadAll();
}
async function loadTable(key){
 let q=companyFilter(sb.from(TABLES[key]).select("*"));
 if(key==="followups")q=q.order("due_at",{ascending:true,nullsFirst:false});
 else if(key==="leads")q=q.order("created_at",{ascending:false});
 else q=q.order("created_at",{ascending:false});
 const {data,error}=await q;
 if(error)throw error;
 state.data[key]=(data||[]).map(x=>({...x,id:x.id}));
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
products(){return '<div class="busy-banner"><strong>BUSY stock is not connected.</strong> Prices and item data saved here are CRM catalogue data only until a verified BUSY connector is installed.</div><div class="table-toolbar card"><input class="search" id="searchRows" placeholder="Search products..."><button class="primary-btn" data-add="products">＋ Add product</button></div><div style="height:12px"></div>'+table(["Product","SKU","Brand","Category","Price","Actions"],state.data.products.map(x=>row(['<strong>'+esc(x.name)+'</strong>',esc(x.sku),esc(x.brand),esc(x.category),money(x.indicative_price),actions("products",x.id)])))},
quotations(){return '<div class="table-toolbar card"><span class="panel-sub">Quotation register</span><button class="primary-btn" data-add="quotations">＋ New quotation</button></div><div style="height:12px"></div>'+table(["Quotation","Date","Valid until","Amount","Status","Actions"],state.data.quotations.map(x=>row(['<strong>'+esc(x.quotation_number)+'</strong>',fmtDate(x.quotation_date),fmtDate(x.valid_until),money(x.amount),status(x.status),actions("quotations",x.id)])))},
orders(){return '<div class="busy-banner"><strong>BUSY posting is disabled.</strong>Orders are stored in CRM only. Review and approve through your accounting process until the supported BUSY connector is verified.</div><div class="table-toolbar card"><span class="panel-sub">Sales order register</span><button class="primary-btn" data-add="orders">＋ Create order</button></div><div style="height:12px"></div>'+table(["Order","Date","Amount","Order status","Actions"],state.data.orders.map(x=>row(['<strong>'+esc(x.order_number)+'</strong>',fmtDate(x.order_date),money(x.amount),status(x.status),actions("orders",x.id)])))},
reports(){const d=state.data;return '<div class="stats">'+[['Pipeline',money(d.leads.reduce((a,x)=>a+Number(x.estimated_value||0),0))],["Customers",d.customers.length],["Quotations",d.quotations.length],["Orders",d.orders.length]].map(x=>'<div class="card stat"><div class="stat-top">'+x[0]+'</div><div class="stat-value">'+x[1]+'</div><div class="stat-foot">Live cloud data</div></div>').join("")+'</div><div class="card panel"><h3>Export records</h3>'+Object.keys(TABLES).map(k=>'<button class="secondary-btn" style="margin:4px" data-export="'+k+'">Export '+k+'</button>').join("")+'</div>'},
busy(){return '<div class="busy-banner"><strong>Not connected · BUSY connector pending</strong>CRM cloud records are working independently. BUSY 21 Standard must be verified locally before stock, ledgers, invoices or voucher sync can be enabled.</div><div class="busy-grid"><div class="card busy-tile"><small>Connection</small><strong>Not connected</strong></div><div class="card busy-tile"><small>Target sync interval</small><strong>15 minutes</strong></div><div class="card busy-tile"><small>Companies</small><strong>'+state.companies.length+'</strong></div></div>'+table(["CRM company","BUSY company name","Status"],state.companies.map(x=>row(['<strong>'+esc(x.name)+'</strong>',esc(x.busy_company_name||"Not configured"),status(x.busy_status)])))}
};
function openForm(type,id){
 const rec=id?state.data[type].find(x=>x.id===id):{};
 editing={type,id:id||null};
 $("#dialogTitle").textContent=(id?"Edit ":"Add ")+(labels[type]||type);
 $("#dialogFields").innerHTML=fields[type].map(([key,label,kind,extra])=>{
  const value=rec[key]??(kind==="date"?new Date().toISOString().slice(0,10):"");
  let control="";
  if(kind==="select"){
   control='<select name="'+key+'">'+extra.split("|").map(v=>'<option value="'+v+'" '+(value===v?"selected":"")+'>'+v.replaceAll("_"," ")+'</option>').join("")+'</select>';
  }else if(kind==="textarea"){
   control='<textarea name="'+key+'">'+esc(value)+'</textarea>';
  }else{
   control='<input name="'+key+'" type="'+kind+'" value="'+esc(value)+'" '+(extra===1?"required":"")+'>';
  }
  return '<div class="field '+(kind==="textarea"?"full":"")+'"><label>'+label+'</label>'+control+'</div>';
 }).join("");
 $("#recordDialog").showModal();
}
async function saveRecord(e){e.preventDefault();if(!editing)return;const btn=$("#saveRecord");btn.disabled=true;try{
 const type=editing.type,tableName=TABLES[type],obj=Object.fromEntries(new FormData(e.currentTarget));
 for(const [k,v] of Object.entries(obj))if(v==="")obj[k]=null;
 for(const k of ["estimated_value","expected_value","indicative_price","amount"])if(obj[k]!==undefined)obj[k]=Number(obj[k]||0);
 if(type==="followups"&&obj.due_at)obj.due_at=new Date(obj.due_at+"T12:00:00").toISOString();
 obj.organization_id=state.orgId;obj.company_id=state.companyId;
 if(editing.id){const {error}=await sb.from(tableName).update(obj).eq("id",editing.id).eq("organization_id",state.orgId);if(error)throw error}
 else{const {error}=await sb.from(tableName).insert(obj);if(error)throw error}
 $("#recordDialog").close();await loadTable(type);render();toast("Saved to cloud successfully.");
 }catch(err){toast("Save failed: "+err.message,true)}finally{btn.disabled=false}}
$("#recordForm").addEventListener("submit",e=>{if(e.submitter?.id==="saveRecord")saveRecord(e)});
async function deleteRecord(type,id){if(!confirm("Delete this "+labels[type]+" record?"))return;try{const {error}=await sb.from(TABLES[type]).delete().eq("id",id).eq("organization_id",state.orgId);if(error)throw error;await loadTable(type);render();toast("Record deleted.")}catch(e){toast("Delete failed: "+e.message,true)}}
function exportCsv(key){const rows=state.data[key]||[];if(!rows.length){toast("No records to export.");return}const cols=Object.keys(rows[0]);const csv=[cols.join(","),...rows.map(o=>cols.map(k=>'"'+String(o[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="goyal-crm-"+key+".csv";a.click();URL.revokeObjectURL(url)}
document.addEventListener("click",async e=>{const p=e.target.closest("[data-page]");if(p){state.page=p.dataset.page;render()}const a=e.target.closest("[data-add]");if(a)openForm(a.dataset.add);const ed=e.target.closest("[data-edit]");if(ed)openForm(ed.dataset.edit,ed.dataset.id);const del=e.target.closest("[data-delete]");if(del)deleteRecord(del.dataset.delete,del.dataset.id);const go=e.target.closest("[data-goto]");if(go){state.page=go.dataset.goto;render()}const ex=e.target.closest("[data-export]");if(ex)exportCsv(ex.dataset.export)});
$("#navigation").addEventListener("click",()=>$("#navigation").classList.remove("open"));
$("#mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("#quickAdd").onclick=()=>openForm(({dashboard:"leads",leads:"leads",customers:"customers",followups:"followups",sites:"sites",products:"products",quotations:"quotations",orders:"orders"}[state.page]||"leads"));
$("#companySelect").onchange=async e=>{state.companyId=e.target.value;await loadAll()};
document.addEventListener("input",e=>{if(e.target.id==="searchRows"){const q=e.target.value.toLowerCase();document.querySelectorAll("#pageContent tbody tr").forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none")}});
$("#signOutBtn").addEventListener("click",async()=>{if(sb)await sb.auth.signOut();location.reload()});
if(sb){sb.auth.getSession().then(({data})=>{if(data.session?.user)startWorkspace(data.session.user)});sb.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){location.reload()}else if(event==="SIGNED_IN"&&session?.user)startWorkspace(session.user)})}else{authNote("The sign-in service did not load. Check your internet connection and refresh the page.",true)}

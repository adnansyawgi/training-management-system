(function(){'use strict';
  /** @type {typeof import('./business-time')} */
  const businessClock = window.businessTime;function errorText(status){return ({400:'Reporting period or filter is invalid.',401:'Your session expired. Sign in again.',403:'You are not authorized to generate reports.'})[status]||'Unable to generate report. Try again.';}
  document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('reportForm');if(!form){ return; }
  const type=document.getElementById('reportType'),message=document.getElementById('pageMessage'),previous=document.getElementById('prevReport'),next=document.getElementById('nextReport'),exportButton=document.getElementById('exportCsv');
  const head=document.getElementById('reportHead'),body=document.getElementById('reportBody'),meta=document.getElementById('reportMeta');
  const columns=Object.fromEntries([...document.querySelectorAll('#reportColumns [data-report]')].map(group=>[group.dataset.report,[...group.querySelectorAll('[data-key]')].map(item=>[item.textContent,item.dataset.key])]));
  let generation=0,page=1,total=0,pageSize=20,active=null,pending=false;
  function show(text){message.className='alert alert-danger';message.textContent=text;}
  function clear(){head.replaceChildren();body.replaceChildren();meta.textContent='';document.getElementById('emptyState').classList.add('d-none');previous.disabled=true;next.disabled=true;exportButton.disabled=true;}
  function sync(){for(const group of form.querySelectorAll('[data-report-filters]')){const visible=group.dataset.reportFilters===type.value;group.classList.toggle('d-none',!visible);group.disabled=!visible;}generation++;active=null;page=1;total=0;clear();}
  function params(){if(!form.reportValidity()){ return null; }const result=new URLSearchParams({pageSize:document.getElementById('pageSize').value});
    for(const key of ['periodFrom','periodTo']){const [day,time]=document.getElementById(key).value.split('T');result.set(key,businessClock.scheduledStart(day,time.length===5?time+':00':time,document.body.dataset.timezone).toISOString());}
    if(result.get('periodFrom')>result.get('periodTo')){show('Period From must not follow Period To.');return null;}
    for(const input of form.querySelector('[data-report-filters="'+type.value+'"]').querySelectorAll('[data-filter]')){ if(input.value){ result.set(input.dataset.filter,input.value); } }return result;
  }
  function controls(busy){pending=busy;document.getElementById('generateReport').disabled=busy;previous.disabled=busy||page<=1;next.disabled=busy||page*pageSize>=total;exportButton.disabled=busy||!active;}

  async function run(requestPage,selection){const request=++generation;clear();controls(true);message.className='alert d-none';
    try{
      const query=new URLSearchParams(selection.query);query.set('page',String(requestPage));
      const response=await fetch('/api/v1/admin/reports/'+selection.type+'?'+query,{credentials:'same-origin',headers:{Accept:'application/json'}});
      if(request!==generation){ return; }if(!response.ok){show(errorText(response.status));active=null;return;}
      const data=await response.json();if(request!==generation){ return; }
      const keys=['reportExecutionId','reportName','reportType','periodFrom','periodTo','generatedAt','generatedBy','status','data','page','pageSize','total'],rowKeys=columns[selection.type].map(([,key])=>key);
      if(!data||Object.keys(data).length!==keys.length||!keys.every(key=>Object.hasOwn(data,key))||data.status!=='SUCCESS'||!Number.isSafeInteger(data.reportExecutionId)||data.reportExecutionId<1||!Number.isSafeInteger(data.generatedBy)||data.generatedBy<1||data.page!==requestPage||!Number.isSafeInteger(data.pageSize)||data.pageSize<1||data.pageSize>100||!Number.isSafeInteger(data.total)||data.total<0||!Array.isArray(data.data)||data.data.length>data.pageSize||!data.data.every(row=>row&&Object.keys(row).length===rowKeys.length&&rowKeys.every(key=>Object.hasOwn(row,key)))){ clear(); active=null; show('Unable to generate report. Try again.'); return; }
      page=data.page;pageSize=data.pageSize;total=data.total;active=selection;
      const header=document.createElement('tr');for(const [label] of columns[selection.type]){const th=document.createElement('th');th.textContent=label;header.append(th);}head.append(header);
      for(const row of data.data){const tr=document.createElement('tr');for(const [,key] of columns[selection.type]){const td=document.createElement('td');td.textContent=row[key]??'';tr.append(td);}body.append(tr);}
      meta.textContent=data.reportName+' | '+data.periodFrom+' – '+data.periodTo+' | Page '+page+' | Total '+total;document.getElementById('emptyState').classList.toggle('d-none',data.data.length!==0);
    }catch{if(request===generation){clear();active=null;show('Unable to generate report. Try again.');}}
    finally{if(request===generation){ controls(false); }}
  }
  type.addEventListener('change',()=>{sync();controls(false);});
  form.addEventListener('submit',event=>{event.preventDefault();if(pending){ return; }try{const query=params();if(query){ void run(1,{type:type.value,query}); }}catch{show('Check the reporting period and filters.');}});
  previous.addEventListener('click',()=>{if(active&&page>1&&!pending){ void run(page-1,active); }});next.addEventListener('click',()=>{if(active&&page*pageSize<total&&!pending){ void run(page+1,active); }});
  exportButton.addEventListener('click',async()=>{
    if(!active||pending){ return; }const selected=active,request=++generation,query=new URLSearchParams(selected.query);query.set('page',String(page));query.set('output','csv');controls(true);
    try{const response=await fetch('/api/v1/admin/reports/'+selected.type+'?'+query,{credentials:'same-origin',headers:{Accept:'text/csv'}});if(request!==generation){ return; }
      if(!response.ok){show(errorText(response.status));return;}if(!response.headers.get('Content-Type')?.startsWith('text/csv')){ show('Unable to export report. Try again.'); return; }
      const blob=await response.blob();if(request!==generation){ return; }const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=selected.type+'-report.csv';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    }catch{if(request===generation){ show('Unable to export report. Try again.'); }}finally{if(request===generation){ controls(false); }}
  });sync();controls(false);
});})();

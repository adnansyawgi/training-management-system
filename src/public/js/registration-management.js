(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form=document.getElementById('filterForm');if(!form)return;
    const rows=document.getElementById('registrationRows'),message=document.getElementById('pageMessage');
    const detail=document.getElementById('registrationDetail'),fields=document.getElementById('registrationDetailFields');
    const previous=document.getElementById('previousPage'),next=document.getElementById('nextPage');
    const listKeys=['registrationId','referenceNo','participantId','programId','registeredAt','status','cancelledAt','cancellationReason'];
    const detailKeys=[...listKeys,'registrationRemarks'];
    const labels={registrationId:'Registration ID',referenceNo:'Reference',participantId:'Student ID',programId:'Program ID',registeredAt:'Registered at',status:'Status',cancelledAt:'Cancelled at',cancellationReason:'Cancellation reason',registrationRemarks:'Registration remarks'};
    let generation=0,currentPage=1,total=0,pageSize=20,filters=new URLSearchParams(),lastView=null;
    function show(text){message.className='alert alert-danger';message.textContent=text;}
    function errorText(status){return ({400:'Check the filter values and date range.',401:'Your session expired. Sign in again.',403:'You do not have access to registration management.',404:'The registration is no longer available.'})[status]||'Unable to load registrations. Try again.';}
    function exact(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
    function validRecord(value,keys){return exact(value,keys)&&['registrationId','participantId','programId'].every(key=>Number.isSafeInteger(value[key])&&value[key]>0)&&['REGISTERED','CANCELLED'].includes(value.status);}
    function timestamp(value){return value===null?'':window.businessTime.localDateTime(value,document.body.dataset.timezone).replace('T',' ')+' ('+document.body.dataset.timezone+')';}
    function controls(pending){form.querySelector('button[type="submit"]').disabled=pending;document.getElementById('clearSearch').disabled=pending;previous.disabled=pending||currentPage<=1;next.disabled=pending||currentPage*pageSize>=total;}
    function hideDetail(){detail.classList.add('d-none');fields.replaceChildren();}
    async function inspect(id,button){
      const request=++generation;hideDetail();message.className='alert d-none';button.disabled=true;
      try{
        const response=await fetch('/api/v1/admin/registrations/'+encodeURIComponent(id),{credentials:'same-origin',headers:{Accept:'application/json'}});
        if(request!==generation)return;if(!response.ok){show(errorText(response.status));return;}
        const data=await response.json();if(request!==generation)return;if(!validRecord(data,detailKeys))throw new Error('Invalid detail.');
        for(const key of detailKeys){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.className='col-sm-4';dd.className='col-sm-8';dt.textContent=labels[key];dd.textContent=['registeredAt','cancelledAt'].includes(key)?timestamp(data[key]):data[key]??'';fields.append(dt,dd);}
        lastView=button;detail.classList.remove('d-none');document.getElementById('detailHeading').focus();
      }catch{if(request===generation)show('Unable to load the registration. Try again.');}
      finally{button.disabled=false;}
    }
    async function load(page){
      const request=++generation;hideDetail();rows.replaceChildren();total=0;controls(true);message.className='alert d-none';document.getElementById('emptyState').classList.add('d-none');document.getElementById('pageInfo').textContent='Loading…';
      try{
        const query=new URLSearchParams(filters);query.set('page',String(page));
        const response=await fetch('/api/v1/admin/registrations?'+query,{credentials:'same-origin',headers:{Accept:'application/json'}});
        if(request!==generation)return;if(!response.ok){show(errorText(response.status));document.getElementById('pageInfo').textContent='';return;}
        const data=await response.json();if(request!==generation)return;
        if(!exact(data,['items','page','pageSize','total'])||!Array.isArray(data.items)||data.page!==page||!Number.isSafeInteger(data.pageSize)||data.pageSize<1||data.pageSize>100||!Number.isSafeInteger(data.total)||data.total<0||data.items.length>data.pageSize||!data.items.every(item=>validRecord(item,listKeys)))throw new Error('Invalid page.');
        currentPage=data.page;pageSize=data.pageSize;total=data.total;
        for(const item of data.items){const tr=document.createElement('tr');for(const key of ['referenceNo','participantId','programId','status']){const td=document.createElement('td');td.textContent=item[key];tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='btn btn-sm btn-outline-primary';button.textContent='View';button.addEventListener('click',()=>inspect(item.registrationId,button));td.append(button);tr.append(td);rows.append(tr);}
        document.getElementById('pageInfo').textContent='Page '+currentPage+' · '+total+' registrations';document.getElementById('emptyState').classList.toggle('d-none',data.items.length!==0);
      }catch{if(request===generation){show('Unable to load registrations. Try again.');document.getElementById('pageInfo').textContent='';}}
      finally{if(request===generation)controls(false);}
    }
    function collect(){
      if(!form.reportValidity())return null;const result=new URLSearchParams();
      for(const key of ['periodFrom','periodTo','programId','categoryId','participantId','status','sort','pageSize']){let value=form.elements.namedItem(key).value;if(!value)continue;
        if(key==='periodFrom'||key==='periodTo'){const [day,time]=value.split('T');value=window.businessTime.scheduledStart(day,time.length===5?time+':00':time,document.body.dataset.timezone).toISOString();}
        result.set(key,value);
      }
      if(result.has('periodFrom')&&result.has('periodTo')&&result.get('periodFrom')>=result.get('periodTo')){show('The start of the date range must precede its end.');return null;}return result;
    }
    form.addEventListener('submit',event=>{event.preventDefault();try{const query=collect();if(query){filters=query;load(1);}}catch{show('Check the filter values and date range.');}});
    document.getElementById('clearSearch').addEventListener('click',()=>{form.reset();filters=collect();load(1);});
    previous.addEventListener('click',()=>{if(currentPage>1)load(currentPage-1);});next.addEventListener('click',()=>{if(currentPage*pageSize<total)load(currentPage+1);});
    document.getElementById('closeDetail').addEventListener('click',()=>{generation++;hideDetail();lastView?.focus();});
    filters=collect();if(filters)load(1);
  });
})();

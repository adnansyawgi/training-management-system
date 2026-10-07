(function(){
  'use strict';
  /** @type {typeof import('./business-time')} */
  const businessClock = window.businessTime;
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('attendanceForm');if(!form)return;
    const program=document.getElementById('programId'),button=document.getElementById('saveAttendance'),message=document.getElementById('pageMessage');
    const boundProgramId=Number(document.body.dataset.programId);let pending=false;
    function show(text,success=false){message.className='alert '+(success?'alert-success':'alert-danger');message.textContent=text;}
    program.addEventListener('change',()=>{
      if(program.value!==String(boundProgramId)){button.disabled=true;window.location.assign('/trainer/programs/'+encodeURIComponent(program.value)+'/attendance');}
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(pending)return;
      if(program.value!==String(boundProgramId)){show('Open the selected program roster before saving attendance.');return;}
      if(!form.reportValidity())return;
      const roster=[...form.querySelectorAll('[data-registration-id]')];if(!roster.length){show('There are no registered participants on this page.');return;}
      let records;
      try{
        records=roster.map(row=>{
          const entry={registrationId:Number(row.dataset.registrationId),status:row.querySelector('.attendance-status').value};
          for(const key of ['checkInAt','checkOutAt','verificationMethod','evidenceReference','remarks']){
            const value=row.querySelector('[data-field="'+key+'"]').value;
            if(key==='checkInAt'||key==='checkOutAt'){
              if(!value){entry[key]=null;continue;}const [day,time]=value.split('T');entry[key]=businessClock.scheduledStart(day,time.length===5?time+':00':time,document.body.dataset.timezone).toISOString();
            }else entry[key]=value.trim()||null;
          }
          return entry;
        });
      }catch{show('Check the date and optional time values.');return;}
      const attendanceDate=form.elements.attendanceDate.value;
      pending=true;for(const control of form.elements)control.disabled=true;program.disabled=true;show('Saving attendance…');
      try{
        const response=await fetch('/api/v1/trainer/programs/'+boundProgramId+'/attendance',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':document.querySelector('meta[name="csrf-token"]').content},body:JSON.stringify({attendanceDate,records})});
        if(!response.ok){show(({400:'Check the attendance fields. All targets must still be registered for this program.',401:'Your session expired. Sign in again.',403:'You do not have access to this program or the security token expired. Reload and try again.',404:'A required program or registration no longer exists.'})[response.status]||'Unable to save attendance. Try again.');return;}
        const result=await response.json(),keys=['attendanceId','registrationId','participantId','programId','attendanceDate','status','percentage','recordedBy'];
        const expected=new Map(records.map(row=>[row.registrationId,row]));
        if(!result||Object.keys(result).length!==1||!Array.isArray(result.items)||result.items.length!==records.length||new Set(result.items.map(row=>row?.registrationId)).size!==records.length||!result.items.every(row=>
          row&&Object.keys(row).length===keys.length&&keys.every(key=>Object.hasOwn(row,key))&&['attendanceId','registrationId','participantId','programId','recordedBy'].every(key=>Number.isSafeInteger(row[key])&&row[key]>0)&&row.programId===boundProgramId&&row.attendanceDate===attendanceDate&&row.status===expected.get(row.registrationId)?.status&&row.percentage===(row.status==='PRESENT'?100:0))){ show('Attendance could not be confirmed. Reload the roster before trying again.'); return; }
        for(const row of roster)row.cells[2].textContent=attendanceDate;
        show('Attendance saved successfully.',true);
      }catch{show('Attendance could not be confirmed. Reload the roster before trying again.');}
      finally{pending=false;for(const control of form.elements)control.disabled=false;program.disabled=false;}
    });
  });
})();

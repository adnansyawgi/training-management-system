(function(){'use strict';document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('certificateForm');if(!form)return;
  const program=document.getElementById('programId'),registration=document.getElementById('registrationId'),completion=document.getElementById('completionDate'),message=document.getElementById('pageMessage'),issue=document.getElementById('issueCertificate');
  let pending=false;const boundProgramId=Number(document.body.dataset.programId);
  function show(text,success=false){message.className='alert '+(success?'alert-success':'alert-danger');message.textContent=text;}
  function updateCompletion(){completion.value=registration.selectedOptions[0]?.dataset.completionDate||'';}
  registration.addEventListener('change',updateCompletion);updateCompletion();
  program.addEventListener('change',()=>{issue.disabled=true;registration.replaceChildren();completion.value='';const query=program.value?'?programId='+encodeURIComponent(program.value):'';window.location.assign(document.body.dataset.pageUrl+query);});
  document.getElementById('cancelCertificate').addEventListener('click',()=>{if(!pending)window.location.assign(document.body.dataset.cancelUrl);});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;if(program.value!==String(boundProgramId)){show('Open the selected program eligibility page before issuing.');return;}if(!form.reportValidity())return;
    const body={registrationId:Number(registration.value),certificateType:form.elements.certificateType.value.trim(),certificateTitle:form.elements.certificateTitle.value.trim()};
    for(const key of ['issuingAuthority','verificationReference','documentReference'])body[key]=form.elements[key].value.trim()||null;
    pending=true;for(const control of form.elements)control.disabled=true;show('Recording issuance…');
    try{
      const response=await fetch('/api/v1/admin/certificates',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':document.querySelector('meta[name="csrf-token"]').content},body:JSON.stringify(body)});
      if(!response.ok){show(({400:'Certificate eligibility or information is invalid. Reload eligibility and check the fields.',401:'Your session expired. Sign in again.',403:'You are not authorized or the security token expired. Reload and try again.',409:'A certificate already exists for this registration.'})[response.status]||'Unable to record certificate issuance. Try again.');return;}
      const result=await response.json(),keys=['certificateId','certificateNumber','participantId','registrationId','programId','certificateType','certificateTitle','eligibilityStatus','eligibilityResult','attendancePercentage','completionDate','issueDate','certificateStatus','documentReference','verificationReference','issuingAuthority','issuedBy'];
      if(response.status!==201||!result||Object.keys(result).length!==keys.length||!keys.every(key=>Object.hasOwn(result,key))||!['certificateId','participantId','registrationId','programId','issuedBy'].every(key=>Number.isSafeInteger(result[key])&&result[key]>0)||result.registrationId!==body.registrationId||result.programId!==boundProgramId||result.certificateStatus!=='ISSUED'||result.eligibilityStatus!=='ELIGIBLE'||result.attendancePercentage!==100||typeof result.certificateNumber!=='string'||!result.certificateNumber||!/^\d{4}-\d{2}-\d{2}$/.test(result.completionDate)||!/^\d{4}-\d{2}-\d{2}$/.test(result.issueDate))throw new Error('Invalid response.');
      registration.selectedOptions[0]?.remove();registration.value='';updateCompletion();show('Certificate issuance recorded. Technical reference: '+result.certificateNumber,true);
    }catch{show('Certificate issuance could not be confirmed. Reload the page before trying again.');}
    finally{pending=false;for(const control of form.elements)control.disabled=false;issue.disabled=registration.options.length<=1;}
  });
});})();

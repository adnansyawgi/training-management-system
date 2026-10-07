const v=require('./implementation-validation');
function makeValidators({errors}){return {issue:v.middleware(req=>{
  v.object(req.params,[]);v.object(req.query,[]);
  return v.schema({registrationId:value=>{if(typeof value!=='number'){ throw v.bad(); }return v.positiveId(value);},
    certificateType:v.text(100),certificateTitle:v.text(255),issuingAuthority:v.nullableText(255),
    verificationReference:v.nullableText(255),documentReference:v.nullableText(500)},['registrationId','certificateType','certificateTitle'])(req.body);
},errors)};}
module.exports={makeValidators};

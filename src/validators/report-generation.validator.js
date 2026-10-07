const v=require('./implementation-validation');
function makeValidators({errors}){
  const id=value=>{const result=v.positiveId(value);if(!Number.isSafeInteger(Number(result))){ throw v.bad(); }return result;};
  const base={periodFrom:v.instant,periodTo:v.instant,page:v.positiveId,pageSize:v.positiveId,output:v.member(['json','csv'])};
  const shared={programId:id,categoryId:id,participantId:id};
  const filters={certificates:{...shared,certificateStatus:v.member(['ISSUED'])},registrations:{...shared,status:v.member(['REGISTERED','CANCELLED'])},accounts:{participantId:id,accountStatus:v.member(['ACTIVE','INACTIVE','LOCKED','DISABLED'])}};
  return Object.fromEntries(Object.entries(filters).map(([type,fields])=>[type,v.middleware(req=>{
    v.object(req.params,[]);if(req.body!==undefined){ v.object(req.body,[]); }
    if(Object.values(req.query).some(value=>typeof value!=='string')){ throw v.bad(); }
    const parsed=v.schema({...base,...fields},['periodFrom','periodTo'])(req.query);
    if(parsed.periodFrom>parsed.periodTo){ throw v.bad(); }return {...parsed,...v.page(req.query),output:parsed.output??'json'};
  },errors)]));
}
module.exports={makeValidators};

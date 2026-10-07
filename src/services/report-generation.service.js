const {makeResponseCodec}=require('../utils/implementation-response-codec');
const {makeResponseTransport}=require('../utils/implementation-response-transport');
const {makeFeatureDto}=require('../repositories/report-generation.dto');
const definitions=require('../reports/report-definitions'),csv=require('../reports/csv');
const metadataKeys=['reportExecutionId','reportName','reportType','periodFrom','periodTo','generatedAt','generatedBy','status','page','pageSize','total'];
function makeService(d){const codec=makeResponseCodec(),dto=makeFeatureDto(codec),transport=makeResponseTransport(codec,Object.fromEntries(Object.keys(definitions).map(type=>[type,metadataKeys])));
  async function generate(type,input,context){const definition=definitions[type];
    return d.executions.run({definition,input,context,materialize:async(connection,execution)=>{
      const result=await d.reports.read(connection,type,input),data=result.rows.map(dto[type]);
      if(input.output==='csv')return {kind:'csv',body:csv.encode(definition.columns,data),contentType:'text/csv; charset=utf-8'};
      const metadata=transport.encode(type,{...execution,periodFrom:input.periodFrom,periodTo:input.periodTo,page:input.page,pageSize:input.pageSize,total:result.total});
      return {kind:'json',body:JSON.stringify({...metadata,data}),contentType:'application/json; charset=utf-8'};
    }});
  }
  return Object.fromEntries(Object.keys(definitions).map(type=>[type,(input,context)=>generate(type,input,context)]));
}
module.exports={makeService};

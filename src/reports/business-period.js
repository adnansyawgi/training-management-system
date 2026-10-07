const {localDateTime,scheduledStart}=require('../public/js/business-time');
function certificateDayBound(value,timezone){const instant=new Date(value),day=localDateTime(instant,timezone).slice(0,10);
  if(instant<=scheduledStart(day,'00:00:00',timezone))return day;
  return new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString().slice(0,10);
}
module.exports={certificateDayBound};

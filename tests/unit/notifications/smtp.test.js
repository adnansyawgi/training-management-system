jest.mock('../../../src/node_modules/nodemailer',()=>({createTransport:jest.fn()}));
const nodemailer=require('../../../src/node_modules/nodemailer');
const {makeSmtpMail}=require('../../../src/notifications/smtp');
let transport;
const env={SMTP_HOST:'smtp.example.test',SMTP_FROM:'service@example.test',SMTP_USER:'user',SMTP_PASSWORD:'secret'};
beforeEach(()=>{transport={sendMail:jest.fn().mockResolvedValue({accepted:['recipient@example.test']}),close:jest.fn()};nodemailer.createTransport.mockReturnValue(transport);});
test.each([465,587])('SMTP port %s enforces verified TLS and 10-second timeouts',async port=>{
  await makeSmtpMail({...env,SMTP_PORT:String(port)}).send({recipient:'recipient@example.test',subject:'Confirmation',messageId:'1',payload:{referenceNo:'R-1',programName:'Program',trainingDate:'2026-12-01',startTime:'09:00:00',endTime:'10:00:00'}});
  expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({secure:port===465,requireTLS:port!==465,tls:{rejectUnauthorized:true},connectionTimeout:10000,socketTimeout:10000}));
  expect(transport.sendMail.mock.calls[0][0].text).toContain('Asia/Kuala_Lumpur');expect(transport.close).toHaveBeenCalled();
});
test('SMTP failure propagates without storing content',async()=>{transport.sendMail.mockRejectedValue(new Error('SMTP failure'));await expect(makeSmtpMail(env).send({recipient:'recipient@example.test',payload:{},messageId:'1'})).rejects.toThrow('SMTP failure');expect(transport.close).toHaveBeenCalled();});
test('entire delivery deadline closes transport',async()=>{
  jest.useFakeTimers();transport.sendMail.mockImplementation(()=>new Promise(()=>{}));
  const delivery=makeSmtpMail(env).send({recipient:'recipient@example.test',payload:{},messageId:'1'});
  const assertion=expect(delivery).rejects.toThrow('SMTP_TIMEOUT');await jest.advanceTimersByTimeAsync(10000);await assertion;jest.useRealTimers();expect(transport.close).toHaveBeenCalled();
});
test('missing SMTP configuration fails before any delivery',()=>{expect(()=>makeSmtpMail({})).toThrow('SMTP configuration');});

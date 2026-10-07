const {makeRegistrationRepository}=require('../../../src/repositories/participant-program-registration.repository');
const {errors}=require('../../../src/auth/authentication-errors');
let repository,connection;
const now=new Date('2026-10-07T00:00:00Z');
const program={program_id:'3',capacity:1,status:'OPEN',training_date:'2026-12-01',start_time:'09:00:00',end_time:'10:00:00',registration_open_at:now,registration_close_at:new Date(now.getTime()+1000)};
beforeEach(()=>{connection={execute:jest.fn().mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{used:0}]]).mockResolvedValueOnce([[]])};repository=makeRegistrationRepository({pool:{},errors,reference:()=> 'R-test'});});
test('inclusive opening permits registration and uses strict schedule intersection SQL',async()=>{
  await repository.assertRegistration(connection,{participant_id:'2'},program,now);
  expect(connection.execute.mock.calls[2][0]).toContain('p.start_time < ? AND p.end_time > ?');
  expect(connection.execute.mock.calls[2][1]).toEqual(['2','2026-12-01','10:00:00','09:00:00']);
});
test('exclusive closing rejects registration',async()=>{await expect(repository.assertRegistration(connection,{participant_id:'2'},program,new Date(now.getTime()+1000))).rejects.toMatchObject({status:409});expect(connection.execute).not.toHaveBeenCalled();});
test('reference collision retries at most three times',async()=>{
  connection.execute.mockReset().mockRejectedValue({code:'ER_DUP_ENTRY',sqlMessage:"Duplicate entry 'R-test' for key 'registrations.reference_no'"});
  await expect(repository.insert(connection,'2','3',now)).rejects.toMatchObject({code:'ER_DUP_ENTRY'});expect(connection.execute).toHaveBeenCalledTimes(3);
});
test('active-registration unique key maps to conflict without retry',async()=>{
  connection.execute.mockReset().mockRejectedValue({code:'ER_DUP_ENTRY',sqlMessage:"Duplicate entry '2:3' for key 'registrations.uq_active_registration'"});
  await expect(repository.insert(connection,'2','3',now)).rejects.toMatchObject({status:409});expect(connection.execute).toHaveBeenCalledTimes(1);
});
test('arbitrary SQL errors never become business conflicts',async()=>{
  connection.execute.mockReset().mockRejectedValue(new Error('private SQL'));await expect(repository.insert(connection,'2','3',now)).rejects.toThrow('private SQL');expect(connection.execute).toHaveBeenCalledTimes(1);
});

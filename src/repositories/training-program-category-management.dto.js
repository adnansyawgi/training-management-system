const { fields } = require('./program-details.dto');
const { makeDto } = require('../utils/implementation-response');
function makeFeatureDto(codec) {
  const { project } = makeDto(codec);
  const category = [['categoryId','category_id','id',false],['name','name','text',false],['description','description','text',true],['status','status','text',false],['updatedAt','updated_at','instant',false]];
  return { adminProgram: row => project(row, [...fields, ['trainerUserId','trainer_user_id','id',false]]),
    createdCategory: row => project(row, [...category, ['createdAt','created_at','instant',false]]),
    updatedCategory: row => project(row, category) };
}
module.exports = { makeFeatureDto };

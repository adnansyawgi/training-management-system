const { makeDto } = require('../utils/implementation-response');
function makeFeatureDto(codec, approvedProgramProjection) {
  const { project } = makeDto(codec);
  const dto = {};
  return dto;
}
module.exports = { makeFeatureDto };

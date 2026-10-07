jest.mock('../../../src/bindings/program-catalogue.bindings', () => ({
  catalogue: { activeCategories: jest.fn().mockResolvedValue([{ category_id: '2', name: '<script>Category</script>' }]),
    readPage: jest.fn().mockResolvedValue({ rows: [], total: 0 }) },
  configuration: require('../../../src/config/program-catalogue')
}));
const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
const bindings = require('../../../src/bindings/program-catalogue.bindings');
test('public page binds escaped categories, approved options, assets and navigation', async () => {
  const result = await request(app).get('/programs').expect(200);
  expect(result.text).toContain('&lt;script&gt;Category&lt;/script&gt;');
  expect(result.text).toContain('data-program-details-base-url="/programs"');
  expect(result.text).toContain('value="AVAILABLE"'); expect(result.text).toContain('value="FULL"');
  expect(result.text).toContain('/js/program-list.js'); expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/program-list.js').expect(200);
  await request(app).get('/api/v1/programs').expect(200);
});
test('category-source failure uses the common sanitized error contract', async () => {
  bindings.catalogue.activeCategories.mockRejectedValueOnce(new Error('SQL private'));
  const result = await request(app).get('/programs').expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private/);
});

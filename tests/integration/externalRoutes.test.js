const request = require('supertest');
const app = require('../../src/app');
const config = require('../../src/config');

describe('Integration: External Data Ingestion & Integration API', () => {
  test('GET /health -> returns system health info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
  });

  test('POST /api/v1/external/import -> successfully ingests batch with valid API key', async () => {
    const timestamp = Date.now();
    const res = await request(app)
      .post('/api/v1/external/import')
      .set('x-api-key', config.external.apiKey)
      .send({
        source: 'sis_integration_test',
        records: [
          {
            email: `externalstudent${timestamp}@campus360.internal`,
            username: `extuser${timestamp.toString().slice(-5)}`,
            firstName: 'Batch',
            lastName: 'Student',
            role: 'student'
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processed).toBe(1);
    expect(res.body.data.failed).toBe(0);
  });

  test('POST /api/v1/external/import -> rejects unauthorized request without API key', async () => {
    const res = await request(app)
      .post('/api/v1/external/import')
      .send({
        source: 'unauthorized_source',
        records: []
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

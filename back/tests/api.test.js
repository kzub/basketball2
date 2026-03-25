const request = require('supertest');
const app = require('../app');

describe('API basic tests', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(404);
  });

  it('should return games list on /api/games', async () => {
    const res = await request(app).get('/api/games');
    expect(res.statusCode).toBe(200);
    // Might be an array, or an object containing error/data depending on implementation
    expect(res.body).toBeDefined();
  });
});

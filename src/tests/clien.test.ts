import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { pool } from '../connect/connect.js';

afterAll(async () => {
  await pool.end();
})
describe('GET /clients/alert', () => {
  
  it('debe retornar 401 si el usuario no está autenticado', async () => {
    const response = await request(app).get('/api/clients/alert');
    expect(response.status).toBe(401);
  });

  it('debe retornar la lista de clientes vencidos para un gym_id específico', async () => {
    // Aquí simulamos un token válido (puedes usar un token real de prueba o mockear el middleware)
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZ3ltX2lkIjozLCJyb2xlIjoiZ3ltX293bmVyIiwiaWF0IjoxNzY4ODc5NDU2LCJleHAiOjE3Njg5MDgyNTZ9.YCdk-fnJ3UorEbDdPGI0Lbjub4g-gUhQkprmil4OD0A"; 

    const response = await request(app)
      .get('/api/clients/alert')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.clients)).toBe(true);
    
    // Si sabemos que Andrew está vencido en la DB de prueba:
    if (response.body.count > 0) {
        expect(response.body.clients[0]).toHaveProperty('name');
        expect(response.body.clients[0]).toHaveProperty('plan_name');
    }
  });
});
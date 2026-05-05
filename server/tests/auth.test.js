const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../app/models/User');

describe('Auth API', () => {
    beforeAll(async () => {
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should return 401 for unauthorized access to tasks', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.statusCode).toEqual(401);
    });

    it('should fail login with wrong credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'wrong@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body.success).toBe(false);
    });
});

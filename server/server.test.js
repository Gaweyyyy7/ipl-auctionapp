import { describe, it, expect } from 'vitest';

describe('Server functionality', () => {
    it('should respond with a 200 status for the root endpoint', async () => {
        const response = await fetch('http://localhost:3000/');
        expect(response.status).toBe(200);
    });

    it('should return JSON data from the /api endpoint', async () => {
        const response = await fetch('http://localhost:3000/api');
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('message');
    });
});
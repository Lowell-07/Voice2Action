/**
 * @jest-environment node
 */
import { POST } from '@/app/api/delete-issue/route';
import admin from '@/lib/firebase/server';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

// Mock the firebase-admin module
jest.mock('@/lib/firebase/server', () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
  }),
}));

describe('/api/delete-issue API route', () => {

  it('should return 401 if authorization header is missing', async () => {
    const { req } = createMocks({
      method: 'POST',
      json: () => ({ problemId: 'test-id' }),
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authorization header missing');
  });

  it('should return 401 for an invalid token', async () => {
     (admin.auth().verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
    
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      json: () => Promise.resolve({ problemId: 'test-id' }),
    });
     
    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized or invalid request');
  });

  it('should return 200 for a valid request', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'test-user-id' });

    const problemId = 'prob-123';
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: {
        problemId,
      },
    });
    
    // We need to mock the json() method on the request object itself for this library
    req.json = jest.fn().mockResolvedValue({ problemId });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(`Problem ${problemId} deleted successfully (simulation).`);
    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('valid-token');
  });
});

/**
 * @jest-environment node
 */
import { POST } from '@/app/api/delete-issue/route';

describe('/api/delete-issue API route', () => {
  it('should return 400 when problemId is missing', async () => {
    const request = new Request('http://localhost/api/delete-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Problem ID is required');
  });

  it('should return 200 for a valid simulated request', async () => {
    const problemId = 'prob-123';
    const request = new Request('http://localhost/api/delete-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ problemId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(`Problem ${problemId} deleted successfully (simulation).`);
  });
});

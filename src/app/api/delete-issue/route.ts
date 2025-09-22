
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const authorization = headersList.get('authorization');
  const { problemId } = await request.json();

  if (!authorization) {
    return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
  }

  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
  }

  const token = authorization.split('Bearer ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
  }

  try {
    // This is where you'd have more complex logic, like checking if the user
    // is the one who reported the issue, or if they are an admin.
    // For this example, we'll just verify the token is valid.
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // The decodedToken.uid gives you the Firebase UID of the user.
    // You can now proceed with your secure logic.
    // In a real app, you would interact with Firestore or other services here.
    console.log(`User ${decodedToken.uid} is authorized to delete problem ${problemId}.`);

    // NOTE: The data is currently mocked on the client. 
    // In a real implementation, you would delete from Firestore like this:
    // await admin.firestore().collection('problems').doc(problemId).delete();

    return NextResponse.json({ message: `Problem ${problemId} deleted successfully (simulation).` }, { status: 200 });

  } catch (error) {
    console.error('Error verifying token or deleting issue:', error);
    return NextResponse.json({ error: 'Unauthorized or invalid request' }, { status: 403 });
  }
}

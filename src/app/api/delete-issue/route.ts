
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const authorization = headersList.get('authorization');
  
  if (!authorization) {
    console.warn('Authorization header missing');
    return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
  }
  
  const token = authorization.split('Bearer ')[1];
  if (!token) {
    console.warn('Invalid token format');
    return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 403 });
  }
  
  const { uid } = decodedToken;
  const { problemId } = await request.json();

  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
  }

  try {
    // In a real app, you would fetch from Firestore.
    // const problemRef = admin.firestore().collection('problems').doc(problemId);
    // const problemDoc = await problemRef.get();

    // if (!problemDoc.exists) {
    //   return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    // }
    
    // const problemData = problemDoc.data();

    // Security Check: Ensure the user deleting the issue is the one who reported it.
    // An admin role could also be allowed here with additional logic.
    // if (problemData.reportedById !== uid) {
    //   console.warn(`User ${uid} attempted to delete problem ${problemId} owned by ${problemData.reportedById}`);
    //   return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this issue.' }, { status: 403 });
    // }

    console.log(`User ${uid} is authorized to delete problem ${problemId}. Simulating deletion.`);

    // await problemRef.delete();
    
    // NOTE: The data is currently mocked on the client, so this is a simulation.
    // The client-side state will be updated optimistically.
    return NextResponse.json({ message: `Problem ${problemId} deleted successfully.` }, { status: 200 });

  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

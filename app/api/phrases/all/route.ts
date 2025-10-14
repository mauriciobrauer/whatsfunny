import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET: Fetch all phrases ordered by most recent
export async function GET() {
  try {
    const phrasesRef = collection(db, 'phrases');
    const snapshot = await getDocs(phrasesRef);
    
    // Filter and sort in JavaScript instead of Firestore query
    const allPhrases = snapshot.docs
      .filter(doc => !doc.data().deleted)
      .map(doc => ({
        id: doc.id,
        text: doc.data().text,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first

    return NextResponse.json(allPhrases);
  } catch (error) {
    console.error('Error fetching all phrases:', error);
    return NextResponse.json({ error: 'Failed to fetch all phrases' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

// GET: Fetch 10 random phrases (excluding soft-deleted ones)
export async function GET() {
  try {
    const phrasesRef = collection(db, 'phrases');
    const snapshot = await getDocs(phrasesRef);
    
    // Filter out soft-deleted phrases
    const allPhrases = snapshot.docs
      .filter(doc => !doc.data().deleted)
      .map(doc => ({
        id: doc.id,
        text: doc.data().text,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

    // Shuffle and get 10 random phrases
    const shuffled = allPhrases.sort(() => 0.5 - Math.random());
    const randomPhrases = shuffled.slice(0, 10);

    return NextResponse.json(randomPhrases);
  } catch (error) {
    console.error('Error fetching phrases:', error);
    return NextResponse.json({ error: 'Failed to fetch phrases' }, { status: 500 });
  }
}

// POST: Add a new phrase
export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Save to Firebase
    const phrasesRef = collection(db, 'phrases');
    const docRef = await addDoc(phrasesRef, {
      text: text.trim(),
      createdAt: Timestamp.now(),
      deleted: false,
    });

    // Save to GitHub Gist (backup)
    try {
      await saveToGitHubGist(text.trim());
    } catch (gistError) {
      console.error('Error saving to GitHub Gist:', gistError);
      // Don't fail the request if Gist save fails
    }

    return NextResponse.json({ 
      id: docRef.id, 
      text: text.trim(),
      message: 'Phrase added successfully' 
    });
  } catch (error) {
    console.error('Error adding phrase:', error);
    return NextResponse.json({ error: 'Failed to add phrase' }, { status: 500 });
  }
}

async function saveToGitHubGist(text: string) {
  const gistId = process.env.GITHUB_GIST_ID;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!gistId || !githubToken) {
    console.log('GitHub Gist not configured, skipping...');
    return;
  }

  try {
    // Get current gist content
    const getResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get gist: ${getResponse.statusText}`);
    }

    const gistData = await getResponse.json();
    const filename = 'phrases-backup.txt';
    const currentContent = gistData.files[filename]?.content || '';

    // Format new entry
    const now = new Date();
    const formattedDate = now.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const newEntry = `[${formattedDate}] ${text}`;
    const updatedContent = currentContent ? `${currentContent}\n${newEntry}` : newEntry;

    // Update gist
    const updateResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [filename]: {
            content: updatedContent
          }
        }
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update gist: ${updateResponse.statusText}`);
    }

    console.log('✅ Saved to GitHub Gist');
  } catch (error) {
    console.error('GitHub Gist error:', error);
    throw error;
  }
}

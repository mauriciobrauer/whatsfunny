import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// PATCH: Update a phrase (edit)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { text } = await request.json();
    const { id } = await params;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const phraseRef = doc(db, 'phrases', id);
    
    // Check if phrase exists
    const phraseDoc = await getDoc(phraseRef);
    if (!phraseDoc.exists()) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    await updateDoc(phraseRef, {
      text: text.trim(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      id, 
      text: text.trim(),
      message: 'Phrase updated successfully' 
    });
  } catch (error) {
    console.error('Error updating phrase:', error);
    return NextResponse.json({ error: 'Failed to update phrase' }, { status: 500 });
  }
}

// DELETE: Soft delete a phrase
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const phraseRef = doc(db, 'phrases', id);
    
    // Check if phrase exists
    const phraseDoc = await getDoc(phraseRef);
    if (!phraseDoc.exists()) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    // Soft delete by setting deleted flag to true
    await updateDoc(phraseRef, {
      deleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({ 
      id,
      message: 'Phrase deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting phrase:', error);
    return NextResponse.json({ error: 'Failed to delete phrase' }, { status: 500 });
  }
}


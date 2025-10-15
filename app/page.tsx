'use client';

import { useState, useEffect } from 'react';

interface Phrase {
  id: string;
  text: string;
  createdAt: Date;
}

export default function Home() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sendingToTelegram, setSendingToTelegram] = useState(false);
  const [sendingToWhatsApp, setSendingToWhatsApp] = useState(false);
  const [sendingToTwilio, setSendingToTwilio] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchPhrases();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const target = event.target as Element;
        if (!target.closest('.overflow-menu')) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const fetchPhrases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/phrases');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setPhrases(data);
      } else {
        setPhrases([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching phrases:', error);
      setPhrases([]);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newPhrase }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add the new phrase at the top and keep only the first 9 of the existing ones
        const updatedPhrases = [
          {
            id: data.id,
            text: data.text,
            createdAt: new Date()
          },
          ...phrases.slice(0, 9) // Keep only the first 9 existing phrases
        ];
        
        setPhrases(updatedPhrases);
        setNewPhrase('');
      }
    } catch (error) {
      console.error('Error adding phrase:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/phrases/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (showAll) {
          // If showing all, just remove from the list
          setAllPhrases(allPhrases.filter(p => p.id !== id));
        } else {
          // Remove the deleted phrase from the list
          const remainingPhrases = phrases.filter(p => p.id !== id);
          
          // Fetch one new random phrase to replace it
          const newPhraseResponse = await fetch('/api/phrases');
          const newPhrases = await newPhraseResponse.json();
          
          // Add the first phrase from the random set (if available)
          if (newPhrases.length > 0) {
            setPhrases([...remainingPhrases, newPhrases[0]]);
          } else {
            setPhrases(remainingPhrases);
          }
        }
        setDeleteConfirmId(null);
        setDeletingId(null);
        showToast('Frase eliminada exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error deleting phrase:', error);
      setDeletingId(null);
      showToast('Error al eliminar la frase', 'error');
    }
  };

  const handleEdit = (phrase: Phrase) => {
    setEditingId(phrase.id);
    setEditText(phrase.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;

    setSavingId(id);
    try {
      const response = await fetch(`/api/phrases/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: editText }),
      });

      if (response.ok) {
        // Update the phrase in the local state without refreshing
        setPhrases(phrases.map(phrase => 
          phrase.id === id ? { ...phrase, text: editText.trim() } : phrase
        ));
        if (showAll) {
          setAllPhrases(allPhrases.map(phrase => 
            phrase.id === id ? { ...phrase, text: editText.trim() } : phrase
          ));
        }
        setEditingId(null);
        setEditText('');
        showToast('Frase actualizada exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error updating phrase:', error);
      showToast('Error al actualizar la frase', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('¡Frase copiada al portapapeles!', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Error al copiar la frase', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendToTelegram = async () => {
    const currentPhrases = showAll ? getPaginatedPhrases() : phrases;
    
    if (currentPhrases.length === 0) {
      showToast('No hay frases para enviar', 'error');
      return;
    }

    setSendingToTelegram(true);
    try {
      const response = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrases: currentPhrases }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`¡${currentPhrases.length} frases enviadas a Telegram!`, 'success');
      } else {
        showToast(data.error || 'Error al enviar a Telegram', 'error');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      showToast('Error al enviar a Telegram', 'error');
    } finally {
      setSendingToTelegram(false);
    }
  };

  const handleSendToWhatsApp = async () => {
    const currentPhrases = showAll ? getPaginatedPhrases() : phrases;
    
    if (currentPhrases.length === 0) {
      showToast('No hay frases para enviar', 'error');
      return;
    }

    setSendingToWhatsApp(true);
    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrases: currentPhrases }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`¡${currentPhrases.length} frases enviadas a WhatsApp!`, 'success');
      } else {
        showToast(data.error || 'Error al enviar a WhatsApp', 'error');
      }
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      showToast('Error al enviar a WhatsApp', 'error');
    } finally {
      setSendingToWhatsApp(false);
    }
  };

  const handleSendToTwilio = async () => {
    const currentPhrases = showAll ? getPaginatedPhrases() : phrases;
    
    if (currentPhrases.length === 0) {
      showToast('No hay frases para enviar', 'error');
      return;
    }

    setSendingToTwilio(true);
    try {
      const response = await fetch('/api/send-twilio-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrases: currentPhrases }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`¡${currentPhrases.length} frases enviadas a WhatsApp vía Twilio!`, 'success');
      } else {
        showToast(data.error || 'Error al enviar a WhatsApp vía Twilio', 'error');
      }
    } catch (error) {
      console.error('Error sending to WhatsApp via Twilio:', error);
      showToast('Error al enviar a WhatsApp vía Twilio', 'error');
    } finally {
      setSendingToTwilio(false);
    }
  };

  const fetchAllPhrases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/phrases/all');
      const data = await response.json();
      setAllPhrases(data);
      setShowAll(true);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all phrases:', error);
      setLoading(false);
    }
  };

  const handleShowAll = () => {
    if (showAll) {
      // Return to random 10
      setShowAll(false);
      fetchPhrases();
    } else {
      // Show all
      fetchAllPhrases();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (showAll) {
      await fetchAllPhrases();
    } else {
      await fetchPhrases();
    }
    setRefreshing(false);
  };

  const getPaginatedPhrases = () => {
    if (!showAll) return phrases;
    const startIndex = (currentPage - 1) * 10;
    return allPhrases.slice(startIndex, startIndex + 10);
  };

  const totalPages = showAll ? Math.ceil(allPhrases.length / 10) : 1;
  const displayPhrases = showAll ? getPaginatedPhrases() : phrases;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Eliminar frase?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que quieres eliminar esta frase? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            What&apos;s funny?
          </h1>
        </div>

        {/* Add new phrase form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <input
                id="phrase-input"
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Enter something funny..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={submitting}
              />
                      <button
                        type="submit"
                        disabled={submitting || !newPhrase.trim()}
                        className="px-3 sm:px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {submitting ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            <span className="sm:hidden text-xl">+</span>
                            <span className="hidden sm:inline">Agregar</span>
                          </>
                        )}
                      </button>
            </div>
          </form>
        </div>

        {/* Display phrases */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {showAll ? `Todas las Frases (${allPhrases.length})` : 'Random Funny Phrases'}
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleShowAll}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {showAll ? 'Ver Aleatorias' : 'Mostrar Todas'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg 
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                {refreshing ? 'Refrescando...' : 'Refrescar'}
              </button>
              <button
                onClick={handleSendToTelegram}
                disabled={sendingToTelegram || loading || (showAll ? getPaginatedPhrases().length === 0 : phrases.length === 0)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg 
                  className={`w-5 h-5 ${sendingToTelegram ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                {sendingToTelegram ? 'Enviando...' : 'Telegram'}
              </button>
              <button
                onClick={handleSendToWhatsApp}
                disabled={sendingToWhatsApp || loading || (showAll ? getPaginatedPhrases().length === 0 : phrases.length === 0)}
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg 
                  className={`w-5 h-5 ${sendingToWhatsApp ? 'animate-spin' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                </svg>
                {sendingToWhatsApp ? 'Enviando...' : 'WhatsApp'}
              </button>
              <button
                onClick={handleSendToTwilio}
                disabled={sendingToTwilio || loading || (showAll ? getPaginatedPhrases().length === 0 : phrases.length === 0)}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg 
                  className={`w-5 h-5 ${sendingToTwilio ? 'animate-spin' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                </svg>
                {sendingToTwilio ? 'Enviando...' : 'Twilio'}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading phrases...</p>
            </div>
          ) : displayPhrases.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No phrases yet. Be the first to add one! 🎉
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {displayPhrases.map((phrase, index) => (
                <div
                  key={phrase.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  {editingId === phrase.id ? (
                    // Edit mode
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                        rows={3}
                        autoFocus
                        disabled={savingId === phrase.id}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEdit(phrase.id)}
                          disabled={savingId === phrase.id}
                          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingId === phrase.id ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Guardando...
                            </>
                          ) : 'Guardar'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingId === phrase.id}
                          className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-300 font-bold">
                          {showAll ? (currentPage - 1) * 10 + index + 1 : index + 1}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="flex-1 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed pr-2">
                          {phrase.text}
                        </p>
                        <div className="relative overflow-menu flex-shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === phrase.id ? null : phrase.id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Más opciones"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {openMenuId === phrase.id && (
                          <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-32">
                            <button
                              onClick={() => {
                                handleCopy(phrase.text);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 rounded-t-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar
                            </button>
                            <button
                              onClick={() => {
                                handleEdit(phrase);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(phrase.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {showAll && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}


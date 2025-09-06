import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useFlashcardStore } from './store';
import { Toast, HelpModal, ImportModal, CreateDeckModal, Nav } from './components';
import { DecksPage, LibraryPage, StatsPage, ProfilePage, ReviewPage, DeckDetailPage, AddCardPage } from './pages';
import { dbOperations } from './database.ts';
import type { Card, Deck } from './types';
import './App.css';

function App() {
  const { importData } = useFlashcardStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);

  // Initialize sample data on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        await dbOperations.initializeSampleData();
        // Note: Zustand handles persistence via localStorage
        // Database is used for additional features and backup
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();

    // Listen for toast events from child components
    const handleToastEvent = (event: CustomEvent) => {
      showToastMessage(event.detail);
    };

    window.addEventListener('show-toast', handleToastEvent as EventListener);
    
    return () => {
      window.removeEventListener('show-toast', handleToastEvent as EventListener);
    };
  }, []);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleImport = (data: { cards: Card[]; decks: Deck[] } | { cards: Card[]; deck: Deck }) => {
    try {
      if ('decks' in data) {
        // Global import
        importData(data);
        showToastMessage('Data imported successfully');
      } else if ('deck' in data) {
        // Deck-specific import - add cards to existing deck
        const { addCard, addCardToDeck } = useFlashcardStore.getState();
        let importedCount = 0;
        
        data.cards.forEach((cardData) => {
          try {
            const newCardId = addCard({
              hanzi: cardData.hanzi,
              pinyin: cardData.pinyin || '',
              english: cardData.english,
            });
            
            // Add to the deck that was imported
            addCardToDeck(data.deck.id, newCardId);
            importedCount++;
          } catch (error) {
            console.error('Failed to import card:', cardData, error);
          }
        });
        
        if (importedCount > 0) {
          showToastMessage(`Successfully imported ${importedCount} card${importedCount !== 1 ? 's' : ''} from deck "${data.deck.name}"`);
        } else {
          showToastMessage('No cards were imported');
        }
      }
    } catch {
      showToastMessage('Import failed');
    }
  };

  return (
    <Router>
      <div className="h-screen overflow-hidden">
        <div className="max-w-[780px] w-full mx-auto h-screen border-l border-r border-granite-custom flex flex-col relative">
          <Nav />

          <main className="px-8 pt-8 flex-1 flex flex-col min-h-0">
            <div className="w-full flex-1 min-h-0 flex flex-col">
              <Routes>
                <Route path="/" element={<DecksPage onCreateDeck={() => setShowCreateDeck(true)} />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/deck/:deckId" element={<DeckDetailPage />} />
                <Route path="/add-card" element={<AddCardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
          
          {/* Toast Notification */}
          <Toast 
            message={toastMessage}
            show={showToast}
            onHide={hideToast}
          />

          {/* Help Button - Fixed position at bottom right */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="fixed bottom-6 right-6 w-8 h-8 bg-granite-custom hover:bg-gray-600 text-light-custom rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
            aria-label="Help"
            title="Help & Documentation"
          >
            <span className="text-md font-medium">?</span>
          </button>

          {/* Import Modal */}
          <ImportModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImport}
          />

          <CreateDeckModal
            isOpen={showCreateDeck}
            onClose={() => setShowCreateDeck(false)}
            onCreate={({ name, description, image }) => {
              const id = useFlashcardStore.getState().addDeck({ name, description, image });
              useFlashcardStore.getState().setSelectedDeckId(id);
              setShowCreateDeck(false);
              setToastMessage('Deck created');
              setShowToast(true);
            }}
          />

          {/* Help Modal */}
          <HelpModal 
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        </div>
      </div>
    </Router>
  );
}

export default App;
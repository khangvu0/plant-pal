import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';
import Button from '../components/Button';
import editIcon from '/edit.svg';
import deleteIcon from '/delete.svg';
import waterIcon from '/water.svg';
import sunIcon from '/sun.svg';

const SAMPLE_PLANTS = [
    {
        id: 1,
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        watering: 'Weekly',
        light: 'Bright, indirect light',
        notes: 'Loves humidity. Mist leaves occasionally.',
        added: '1/14/2025',
        imageUrl: null,
    },
    {
        id: 2,
        name: 'Snake Plant',
        species: 'Sansevieria trifasciata',
        watering: 'Every 2–3 weeks',
        light: 'Low to bright light',
        notes: 'Very drought tolerant. Great air purifier.',
        added: '1/31/2025',
        imageUrl: null,
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('collection');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [plants, setPlants] = useState(() => [...SAMPLE_PLANTS]);

    const [newPlant, setNewPlant] = useState({ nickname: '' });
    const SUGGEST_DEBOUNCE_MS = 2000; // Delaying the API call by 2 seconds
    const [nameQuery, setNameQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [isSuggestLoading, setIsSuggestLoading] = useState(false);
    const [suggestError, setSuggestError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isAddingPlant, setIsAddingPlant] = useState(false);
    const [insights, setInsights] = useState(null);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState(null);
    const [editingPlantId, setEditingPlantId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', species: '' });
    const [updatingPlantId, setUpdatingPlantId] = useState(null);
    const [deletingPlantId, setDeletingPlantId] = useState(null);
    const [plantActionError, setPlantActionError] = useState(null);
    const [pendingDeletePlant, setPendingDeletePlant] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const formatServerPlant = (plant) => {
    if (!plant) return null;
    return {
        id: plant.id,
        name: plant.name || '',
        species: plant.species || '',
        watering: plant.watering_frequency || 'Water as needed',
        light: plant.sunlight || 'Information not available',
        notes: plant.notes || '',
        imageUrl: plant.image_url || null,
        added: plant.created_at
            ? new Date(plant.created_at).toLocaleDateString()
            : 'Recently added',
    };
};

const [chatHistory, setChatHistory] = useState([
    {
        role: 'assistant',
        content: 'Hi! I’m Plant Pal🌱. How can I help today?',
    },
]);
const [isChatLoading, setIsChatLoading] = useState(false);
const [chatError, setChatError] = useState(null);
const [userInput, setUserInput] = useState('');
useEffect(() => {
    const query = nameQuery.trim();

if (selectedSuggestion) {
    setIsSuggestLoading(false);
    setShowSuggestions(false);
    return;
}
if (query.length < 2) {
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSuggestLoading(false);
    setSuggestError(null);
    return;
}

let isActive = true;
const controller = new AbortController();
setIsSuggestLoading(true);
setSuggestError(null);

    const timer = setTimeout(async () => {
        try {
            const response = await fetch(
                `/api/plants/suggest?q=${encodeURIComponent(query)}`,
                { signal: controller.signal }
            );
            if (!response.ok) {
                throw new Error(`Suggest failed (${response.status})`);
            }
            const { suggestions: data } = await response.json();
            if (!isActive) return;
            setSuggestions(Array.isArray(data) ? data : []);
            setShowSuggestions(true);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Plant suggest error:', error);
            if (isActive) {
                setSuggestError('Unable to search plants right now.');
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } finally {
            if (isActive) {
                setIsSuggestLoading(false);
            }
        }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
        isActive = false;
        controller.abort();
        clearTimeout(timer);
    };
}, [nameQuery, selectedSuggestion]);

const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setNameQuery(suggestion.common_name || suggestion.scientific_name || '');
    setShowSuggestions(false);
    setSuggestions([]);
    setSuggestError(null);
};

// For Perenual API
const handleAddPlant = async () => {
    if (!selectedSuggestion) {
        setSuggestError('Please choose a plant from the list.');
        return;
    }

setIsAddingPlant(true);
setPlantActionError(null);
try {
    const doFetchDetails = async () => {
        const resp = await fetch(`/api/plants/details/${selectedSuggestion.id}`);
        return resp;
    };

    let response = await doFetchDetails();
    if (response.status === 429) {
        await new Promise((r) => setTimeout(r, 2500));
        response = await doFetchDetails();
    }

if (!response.ok) {
    if (response.status === 404) {
        setSuggestError('Details not available for this plant. Please select another.');
        return;
    }
    if (response.status === 429) {
        setSuggestError('Rate limited. Please wait a moment and try again.');
        return;
    }
    throw new Error(`Plant details failed (${response.status})`);
}

const { plant: details } = await response.json();
const basePlant = {
    name:
        newPlant.nickname ||
        details.common_name ||
        details.scientific_name ||
        nameQuery,
    species: details.scientific_name || details.common_name || '',
    watering: details.watering_frequency || 'Water as needed',
    light: details.sunlight || 'Information not available',
    notes: details.description || '',
    imageUrl: details.image,
    added: new Date().toLocaleDateString(),
};

    if (user) {
        try {
            const plantData = {
                name: basePlant.name,
                species: basePlant.species,
                watering_frequency: basePlant.watering,
                sunlight: basePlant.light,
                notes: basePlant.notes,
                image_url: basePlant.imageUrl
            };
            const saveResponse = await axios.post('/api/user/plants', plantData);
            if (!saveResponse.data?.success) {
                throw new Error('Save response missing plant information');
            }
            const savedPlant = formatServerPlant(saveResponse.data?.plant);
            setPlants((prev) => [
                ...prev,
                savedPlant ?? {
                    ...basePlant,
                    id: saveResponse.data?.plant?.id ?? Date.now(),
                },
            ]);
            await loadInsights();
        } catch (dbError) {
            console.error('Failed to save to database:', dbError);
            setPlantActionError(
                dbError.response?.data?.error ||
                    'Unable to save plant to your collection. Please try again.'
            );
            return;
        }
    } else {
        setPlants((prev) => [
            ...prev,
            {
                ...basePlant,
                id: Date.now(),
            },
        ]);
    }
    
    setIsAddModalOpen(false);
    setNewPlant({ nickname: '' });
    setNameQuery('');
    setSuggestions([]);
    setSelectedSuggestion(null);
    setSuggestError(null);
} catch (error) {
    console.error('Add plant failed:', error);
    alert(error.message || 'Unable to add plant right now.');
} finally {
    setIsAddingPlant(false);
}
};
// For OpenAI API
const handleChatSubmit = async (event) => {
    event.preventDefault();
    const prompt = userInput.trim();
    if (!prompt || isChatLoading) return;

    const nextHistory = [...chatHistory, { role: 'user', content: prompt }];
    setChatHistory(nextHistory);
    setUserInput('');
    setChatError(null);
    setIsChatLoading(true);

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: chatHistory, prompt }),
        });

        if (!response.ok)
            throw new Error(`AI request failed (${response.status})`);
        const { history: serverHistory } = await response.json();
        setChatHistory(serverHistory ?? nextHistory);
    } catch (error) {
        console.error('AI Botanist error:', error);
        setChatHistory([
            ...nextHistory,
            {
                role: 'assistant',
                content:
                    'Sorry, my greenhouse is offline. :( Please try again soon.',
            },
        ]);
        setChatError('The AI botanist is temporarily unavailable.');
    } finally {
        setIsChatLoading(false);
    }
};

// Redirect to login if not authenticated
useEffect(() => {
    if (!user) {
        navigate('/login');
    }
}, [user, navigate]);

// Load user's plants from database
useEffect(() => {
    if (user) {
        setEditingPlantId(null);
        setEditForm({ name: '', species: '' });
        loadUserPlants();
        loadInsights();
    } else {
        setPlants([...SAMPLE_PLANTS]);
        setInsights(null);
        setInsightsError(null);
        setEditingPlantId(null);
        setEditForm({ name: '', species: '' });
        setPlantActionError(null);
    }
}, [user]);

const loadUserPlants = async () => {
    if (!user) return;
    try {
        const response = await axios.get('/api/user/plants');
        if (response.data.success) {
            const dbPlants = response.data.plants
                .map((plant) => formatServerPlant(plant))
                .filter(Boolean);
            setPlants(dbPlants);
            setPlantActionError(null);
        } else {
            setPlants([]);
            setPlantActionError('Unable to load your plant collection.');
        }
    } catch (error) {
        console.error('Failed to load plants:', error);
        setPlantActionError('Unable to load your plant collection.');
    }
};

const loadInsights = async () => {
    if (!user) return;
    setIsInsightsLoading(true);
    setInsightsError(null);

    try {
        const response = await axios.get('/api/ai/insights');
        if (response.data.success) {
            setInsights(response.data.insights);
        } else {
            throw new Error('Insights unavailable');
        }
    } catch (error) {
        console.error('Failed to load insights:', error);
        setInsightsError('Climate insights are temporarily unavailable.');
        setInsights(null);
    } finally {
        setIsInsightsLoading(false);
    }
};

const handleStartEdit = (plant) => {
    setPlantActionError(null);
    setEditingPlantId(plant.id);
    setEditForm({
        name: plant.name || '',
        species: plant.species || '',
    });
};

const handleCancelEdit = () => {
    setEditingPlantId(null);
    setEditForm({ name: '', species: '' });
    setUpdatingPlantId(null);
};

const handleSaveEdit = async (plantId) => {
    const trimmedName = editForm.name.trim();
    const trimmedSpecies = editForm.species.trim();

    if (!trimmedName) {
        setPlantActionError('Plant name cannot be empty.');
        return;
    }

setPlantActionError(null);
setUpdatingPlantId(plantId);

try {
    let updatedServerPlant = null;
    if (user) {
        const response = await axios.put(`/api/user/plants/${plantId}`, {
            name: trimmedName,
            species: trimmedSpecies,
        });
        updatedServerPlant = formatServerPlant(response.data?.plant);
    }

    setPlants((prev) =>
        prev.map((plant) =>
            plant.id === plantId
                ? updatedServerPlant
                    ? { ...plant, ...updatedServerPlant }
                    : {
                        ...plant,
                        name: trimmedName,
                        species: trimmedSpecies,
                    }
                : plant
        )
    );

    if (user) {
        await loadInsights();
    }

    handleCancelEdit();
} catch (error) {
    console.error('Failed to update plant:', error);
    setPlantActionError(
        error.response?.data?.error ||
            'Unable to update plant details right now.'
    );
} finally {
    setUpdatingPlantId(null);
}
};

const handleDeletePlant = async (plantId) => {
    setPlantActionError(null);
    setDeletingPlantId(plantId);

    try {
        if (user) {
            await axios.delete(`/api/user/plants/${plantId}`);
        }

        setPlants((prev) => prev.filter((plant) => plant.id !== plantId));

        if (editingPlantId === plantId) {
            handleCancelEdit();
        }

        if (user) {
            await loadInsights();
        }

        return true;
    } catch (error) {
        console.error('Failed to delete plant:', error);
        setPlantActionError(
            error.response?.data?.error ||
                'Unable to remove this plant right now.'
        );
        return false;
    } finally {
        setDeletingPlantId(null);
    }
};

const openDeleteConfirmation = (plant) => {
    setPlantActionError(null);
    setPendingDeletePlant(plant);
    setIsConfirmOpen(true);
};

const closeDeleteConfirmation = () => {
    if (deletingPlantId) return;
    setIsConfirmOpen(false);
    setPendingDeletePlant(null);
};

const confirmDeletePlant = async () => {
    if (!pendingDeletePlant) return;
    const success = await handleDeletePlant(pendingDeletePlant.id);
    if (success) {
        setIsConfirmOpen(false);
        setPendingDeletePlant(null);
    }
};

return (
<div className="dashboard">
    <header className="dashboard--header">
        <h2 className="dashboard--header_title">
            PlantPal Care Assistant
        </h2>
        <p className="dashboard--header_description">
            Manage your plant collection and chat with your AI botanist
            for sustainable care advice
        </p>

{user && (
    <div className="dashboard--insights">
        {isInsightsLoading && (
            <p className="insights-status">Calculating your impact…</p>
        )}
        {insightsError && (
            <p className="insights-error">{insightsError}</p>
        )}
        {insights && !isInsightsLoading && !insightsError && (
            <div className="insights-grid">
                <div className="insight-card">
                    <h4>Estimated CO₂ Removal</h4>
                    <p className="insight-highlight">
                        {insights.co2_kg_per_year?.toFixed
                            ? insights.co2_kg_per_year.toFixed(1)
                            : insights.co2_kg_per_year}{' '}
                        kg / year
                    </p>
                </div>
                <div className="insight-card">
                    <h4>Sustainbility Tips</h4>
                    <p>{insights.summary}</p>
                </div>
                <div className="insight-card">
                    <h4>Suggested Next Plant</h4>
                    <p className="insight-highlight">
                        {insights.suggested_species}
                    </p>
                    <p>{insights.suggestion_reason}</p>
                </div>
            </div>
        )}
    </div>
)}

    <div className="dashboard--tabs">
        <button
            className={`tab-btn ${
                activeTab === 'collection' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('collection')}>
            My Collection
        </button>
        <button
            className={`tab-btn ${
                activeTab === 'ai' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('ai')}>
            AI Botanist
        </button>
    </div>
</header>

{/* My Collection View */}
{activeTab === 'collection' && (
<section className="plant-collection">
    <div className="plant-collection-header">
        <h3 className="collection-title">
            Your Plants ({plants.length})
        </h3>
        <Button
            className="add-plant-btn"
            onClick={() => {
                setIsAddModalOpen(true);
                setNameQuery('');
                setSuggestions([]);
                setSelectedSuggestion(null);
                setSuggestError(null);
            }}>
            + Add Plant
        </Button>
    </div>
    <p>Manage and track your growing collection</p>

{plantActionError && (
    <p className="plant-action-error">{plantActionError}</p>
)}

{plants.length === 0 ? (
    <p className="collection-empty">
        No plants yet. Add a favorite to kickstart your
        collection and insights.
    </p>
) : (
<div className="plant-grid">
    {plants.map((plant) => (
        <div className="plant-card" key={plant.id}>
        {plant.imageUrl && (
            <img
                src={plant.imageUrl}
                alt={`${plant.name} plant`}
                className="plant-photo"
            />
        )}
        <div className="plant-header">
            <div>
                {editingPlantId === plant.id ? (
                    <div className="plant-edit-fields">
                        <input
                            type="text"
                            className="plant-edit-input browser-default"
                            value={editForm.name}
                            onChange={(event) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="Plant name"
                            disabled={
                                updatingPlantId === plant.id
                            }
                        />
                        <input
                            type="text"
                            className="plant-edit-input browser-default"
                            value={editForm.species}
                            onChange={(event) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    species: event.target.value,
                                }))
                            }
                            placeholder="Species (optional)"
                            disabled={
                                updatingPlantId === plant.id
                            }
                        />
                    </div>
                ) : (
                    <>
                        <h4 className="plant-name">
                            {plant.name}
                        </h4>
                        <p className="plant-species">
                            {plant.species}
                        </p>
                    </>
                )}
            </div>
            <div className="plant-actions">
                {editingPlantId === plant.id ? (
                    <>
                        <button
                            type="button"
                            className="plant-action-btn save"
                            onClick={() =>
                                handleSaveEdit(plant.id)
                            }
                            disabled={
                                updatingPlantId === plant.id
                            }>
                            {updatingPlantId === plant.id
                                ? 'Saving…'
                                : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="plant-action-btn cancel"
                            onClick={handleCancelEdit}
                            disabled={
                                updatingPlantId === plant.id
                            }>
                            Cancel
                        </button>
                    </>
                ) : deletingPlantId === plant.id ? (
                    <span className="plant-action-status">
                        Removing…
                    </span>
                ) : (
                    <>
                        <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                                handleStartEdit(plant)
                            }
                            aria-label="Edit plant">
                            <img
                                src={editIcon}
                                alt=""
                                className="icon"
                            />
                        </button>
                        <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                                openDeleteConfirmation(plant)
                            }
                            aria-label="Delete plant">
                            <img
                                src={deleteIcon}
                                alt=""
                                className="icon"
                            />
                        </button>
                    </>
                )}
            </div>
        </div>

            <div className="plant-details">
                <div className="plant-row">
                    <img src={waterIcon} alt="water icon" />
                    <div>
                        <strong>Watering Interval</strong>
                        <p>{plant.watering}</p>
                    </div>
                </div>
                <div className="plant-row">
                    <img src={sunIcon} alt="sun icon" />
                    <div>
                        <strong>Light</strong>
                        <p>{plant.light}</p>
                    </div>
                </div>
                <p className="plant-notes">{plant.notes}</p>
                <p className="plant-date">
                    Added: {plant.added}
                </p>
            </div>
        </div>
    ))}
    </div>
)}

{isAddModalOpen && (
<div className="custom-modal-overlay">
    <div className="custom-modal">
        <h3>Add a New Plant</h3>
        <label>Nickname (optional)</label>
        <input
            type="text"
            value={newPlant.nickname}
            onChange={(e) =>
                setNewPlant({
                    ...newPlant,
                    nickname: e.target.value,
                })
            }
            placeholder="e.g., Leafy"
            disabled={isAddingPlant}
        />
        <label>Plant name</label>
        <div className="plant-suggest">
            <input
                type="text"
                value={nameQuery}
                onChange={(e) => {
                    setNameQuery(e.target.value);
                    setSelectedSuggestion(null);
                    setSuggestError(null);
                }}
                onFocus={() => {
                    if (suggestions.length > 0 && !selectedSuggestion) {
                        setShowSuggestions(true);
                    }
                }}
                onBlur={() => {
                    setTimeout(
                        () => setShowSuggestions(false),
                        120
                    );
                }}
                placeholder="Start typing to search..."
                disabled={isAddingPlant}
            />
            {isSuggestLoading && (
                <p className="plant-suggest__status">
                    Searching…
                </p>
            )}
            {!isSuggestLoading &&
                showSuggestions &&
                suggestions.length === 0 &&
                nameQuery.trim().length >= 2 && (
                    <p className="plant-suggest__status">
                        No matches found.
                    </p>
                )}
            {suggestError && (
                <p className="plant-suggest__error">
                    {suggestError}
                </p>
            )}
            {showSuggestions &&
                suggestions.length > 0 && (
                    <ul className="plant-suggest__list">
                        {suggestions.map((suggestion) => {
                            const primary =
                                suggestion.common_name ||
                                suggestion.scientific_name ||
                                'Unnamed plant';
                            const secondary =
                                suggestion.scientific_name &&
                                suggestion.scientific_name !==
                                    suggestion.common_name
                                    ? ` — ${suggestion.scientific_name}`
                                    : '';
                            return (
                                <li
                                    key={suggestion.id}
                                    className={`plant-suggest__item`}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        handleSuggestionSelect(suggestion);
                                    }}>
                                    <span className="plant-suggest__primary">
                                        {primary}
                                        {secondary}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
        </div>
        <div className="custom-modal-actions">
            <button
                type="button"
                onClick={handleAddPlant}
                disabled={
                    isAddingPlant || !selectedSuggestion
                }>
                {isAddingPlant ? 'Adding…' : 'Add'}
            </button>
            <button
                type="button"
                className="cancel"
                onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedSuggestion(null);
                    setSuggestions([]);
                    setNameQuery('');
                    setSuggestError(null);
                }}>
                Cancel
            </button>
        </div>
    </div>
</div>
)}
</section>
)}

{/* AI Botanist View */}
{activeTab === 'ai' && (
    <section className="ai-botanist">
        <div className="chat-box">
            {chatHistory.map((turn, index) => (
                <div
                    key={index}
                    className={`chat-message ${
                        turn.role === 'user' ? 'user' : 'bot'
                    }`}>
                    {turn.content}
                </div>
            ))}
            {isChatLoading && (
                <div className="chat-message bot typing">
                    PlantPal is thinking…
                </div>
            )}
        </div>
        {chatError && <p className="chat-error">{chatError}</p>}
        <form className="chat-input" onSubmit={handleChatSubmit}>
            <input
                type="text"
                placeholder="Ask your AI botanist..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isChatLoading}
                className="browser-default"
            />
            <button type="submit" disabled={isChatLoading}>
                Send
            </button>
        </form>
    </section>
)}

{isConfirmOpen && pendingDeletePlant && (
<div
    className="custom-modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-confirm-title"
    aria-describedby="delete-confirm-description"
    onClick={closeDeleteConfirmation}>
    <div
        className="custom-modal confirm-modal"
        onClick={(event) => event.stopPropagation()}>
        <h3 id="delete-confirm-title">
            Delete{' '}
            <span className="confirm-plant-name">
                {pendingDeletePlant.name || 'this plant'}
            </span>
            ?
        </h3>
        <p id="delete-confirm-description">
            This will remove the plant from your collection and
            update your insights. This action cannot be undone.
        </p>
        {plantActionError && deletingPlantId === pendingDeletePlant.id && (
            <p className="plant-action-error">{plantActionError}</p>
        )}
        <div className="confirm-modal-actions">
            <button
                type="button"
                className="confirm-btn danger"
                onClick={(event) => {
                    event.stopPropagation();
                    confirmDeletePlant();
                }}
                disabled={deletingPlantId === pendingDeletePlant.id}>
                {deletingPlantId === pendingDeletePlant.id
                    ? 'Removing…'
                    : 'Confirm'}
            </button>
            <button
                type="button"
                className="confirm-btn secondary"
                onClick={(event) => {
                    event.stopPropagation();
                    closeDeleteConfirmation();
                }}
                disabled={deletingPlantId === pendingDeletePlant.id}>
                Cancel
            </button>
        </div>
    </div>
</div>
)}
</div>
);
}

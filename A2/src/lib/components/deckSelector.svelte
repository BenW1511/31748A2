<!-- Component for saving, loading, and deleting a user's decks -->
<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { selectedDeck, type DeckSummary } from '$lib/stores/selectedDeck';
  import { deck } from '$lib/stores/deck';

  let userDecks = $state<DeckSummary[]>([]);
  let newDeckName = $state('');
  let selectedDeckId = $state('');
  let message = $state('');
  let isLoading = $state(false);

  async function loadDecks() {
    if (!$user){return};

    isLoading = true; message = '';

    try {
      const response = await fetch('/api/decks');
      const data = await response.json();

      if (data.success) {
        userDecks = data.decks;
        if (userDecks.length > 0) {
          const firstDeck = userDecks[0];
          selectedDeck.set(firstDeck);
          selectedDeckId = String(firstDeck.id);

        } else {
          selectedDeck.set(null);
          selectedDeckId = '';
          deck.reset();
        }
      } else { message = data.error ?? data.message ?? 'Could not load decks.';}
      
    } catch (error) {
      console.error('Failed to load decks:', error);
      message = 'Could not load decks.';

    } finally { isLoading = false;}
  }

  async function createDeck() {
    if (!$user){return};

    if (!newDeckName.trim()) {message = 'Please enter a deck name.'; return; }
    message = '';

    try {
      const response = await fetch('/api/decks', {
        method: 'POST', headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({name: newDeckName.trim()})
      });

      const data = await response.json();

      if (data.success) {
        newDeckName = '';
        message = 'Deck created successfully.';
        await loadDecks();
      } else {message = data.error ?? data.message ?? 'Could not create deck.';}
    } catch (error) {
      console.error('Failed to create deck:', error);
      message = 'Could not create deck.';
    }
  }

  async function chooseDeck() {
    const chosenDeck = userDecks.find((deckItem) => {return deckItem.id === Number(selectedDeckId);});

    if (!chosenDeck) {
      selectedDeck.set(null);
      deck.reset();
      return;
    }
    selectedDeck.set(chosenDeck);
    await deck.loadFromDatabase(chosenDeck.id);

    message = `Loaded deck: ${chosenDeck.name}`;
  }

  async function deleteCurrentDeck() {
    if (!$selectedDeck) {alert('Please select a deck first.'); return; }

    const confirmation = confirm(`Are you sure you want to delete "${$selectedDeck.name}"?`);
    if (!confirmation){return};

    const response = await fetch(`/api/decks/${$selectedDeck.id}`, {method: 'DELETE'});
    const data = await response.json();

    if (!response.ok || !data.success) { alert(data.message ?? 'Failed to delete deck.'); return; }
    selectedDeck.set(null);
    deck.reset();

    await loadDecks();
    alert('Deck deleted successfully.');
  }

  $effect(() => {
    if ($user) { loadDecks();} else {
      userDecks = [];
      selectedDeckId = '';
      selectedDeck.set(null);
      deck.reset();
    }
  });
</script>

<section class="deck-selector">
  <h2>Your Decks</h2>
  <p class="deck-note"> Please Note: if you have no decks, please name your first deck and hit save. </p>
  <div class="create-row">
    <input
      bind:value={newDeckName}
      placeholder="New deck name"
    />

    <button onclick={createDeck} disabled={!$user}>
      Save Deck
    </button>
  </div>

  {#if isLoading}
    <p>Loading decks...</p>
  {/if}

  {#if userDecks.length > 0}
    <label>
      Load Deck

      <select bind:value={selectedDeckId} onchange={chooseDeck}>
        {#each userDecks as deckItem (deckItem.id)}
          <option value={deckItem.id}>
            {deckItem.name}
          </option>
        {/each}
      </select>
    </label>
  {:else if !isLoading}
    <p>No decks found. Create one above.</p>
  {/if}

    <div class="current-deck-row">
    <p>
      <strong>Current deck:</strong>
      {$selectedDeck ? $selectedDeck.name : 'None selected'}
    </p>

    {#if $selectedDeck}
      <button class="delete-deck-button" onclick={deleteCurrentDeck}>
        Delete Deck
      </button>
    {/if}
  </div>

  {#if message}
    <p class="message">
      {message}
    </p>
  {/if}
</section>

<style>
  .deck-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid black;
  }

  h2 {
    margin: 0;
  }

  .create-row {
    display: flex;
    gap: 0.5rem;
  }

  input,
  select {
    padding: 0.5rem;
    border: 1px solid black;
    border-radius: 6px;
  }

  input {
    flex: 1;
  }

  button {
    padding: 0.5rem 0.75rem;
    border: 1px solid black;
    border-radius: 6px;
    cursor: pointer;
    background: white;
  }

  button:disabled {
    background: #d0d0d0;
    color: #777;
    cursor: not-allowed;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: bold;
  }

  .message {
    color: darkred;
    font-weight: bold;
  }
  .deck-note {
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  font-style: italic;
  }

  .current-deck-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
  }

  .current-deck-row p {
    margin: 0;
  }

  .delete-deck-button {
    padding: 0.55rem 0.9rem;
    border: 1px solid black;
    border-radius: 8px;
    background-color: white;
    color: black;
    cursor: pointer;
  }

  .delete-deck-button:hover {
    background-color: #ffd6d6;
  }
</style>
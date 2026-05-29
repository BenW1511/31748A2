<!-- Component for searching cards to build into deck -->
<script lang="ts">
  import { deckStore, nonCommanderSections } from '$lib/stores/deck';
  import type { DeckCard, DeckSection } from '$lib/stores/deck';
  import { selectedDeck } from '$lib/stores/selectedDeck';

  type SearchCard = {
    id: string;
    name: string;
    mana_cost?: string;
    type_line?: string;
    image_url?: string;
    source?: string;
    cmc?: number;
    colors?: string[];
    color_identity?: string[];
    oracle_text?: string;
  };

  let activeSection = $state<DeckSection | null>(null);
  let searchText = $state('');
  let searchResults = $state<SearchCard[]>([]);
  let message = $state('');
  let isSearching = $state(false);

  let searchTimeout: ReturnType<typeof setTimeout>;

  function sectionToScryfallQuery(section: DeckSection) {
    if (section === 'Commander') return 'is:commander';
    if (section === 'Lands') return 't:land';
    if (section === 'Creatures') return 't:creature';
    if (section === 'Instants') return 't:instant';
    if (section === 'Sorceries') return 't:sorcery';
    if (section === 'Artifacts') return 't:artifact';
    if (section === 'Enchantments') return 't:enchantment';
    if (section === 'Planeswalkers') return 't:planeswalker';

    return '';
  }

  async function searchCards(section: DeckSection) {
    activeSection = section;
    message = '';
    searchResults = [];

    if (!searchText.trim()) {message = 'Please enter a card name to search.'; return; }

    isSearching = true;

    try {
      const sectionQuery = sectionToScryfallQuery(section);
      const query = `${searchText.trim()} ${sectionQuery}`.trim();
      const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!data.success) {
        message = data.error ?? data.message ?? 'No cards found.';
        searchResults = [];
        return;
      }
      searchResults = data.cards;

    } catch (error) {
      console.error('Card search failed:', error);
      message = 'Card search failed.';
    } finally {isSearching = false;}
  }

  function handleLiveSearch() {
    clearTimeout(searchTimeout);

    if (!activeSection){return};

    if (searchText.trim().length < 3) {
      searchResults = [];
      message = '';
      return;
    }

    searchTimeout = setTimeout(() => {if (activeSection) {searchCards(activeSection);}}, 500);
  }

  async function saveCardToDatabase(section: DeckSection, card: SearchCard) {
    if (!$selectedDeck) {message = 'Please create or select a deck before adding cards.'; return; }

    const response = await fetch(`/api/decks/${$selectedDeck.id}/cards`, {
      method: 'POST',headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({section, card})
    });

    const data = await response.json();

    if (!data.success) {message = data.error ?? data.message ?? 'Could not save card to database.';}
  }

  async function addCard(section: DeckSection, card: SearchCard) {
    if (!$selectedDeck) {message = 'Please create or select a deck before adding cards.'; return; }

    const deckCard: DeckCard = {
      id: card.id,
      name: card.name,
      mana_cost: card.mana_cost ?? '',
      type_line: card.type_line ?? '',
      image_url: card.image_url ?? '',
      source: card.source ?? 'scryfall',
      cmc: card.cmc ?? 0,
      colors: card.colors ?? [],
      color_identity: card.color_identity ?? [],
      oracle_text: card.oracle_text ?? '',
      quantity: 1,
      section
    };

    deckStore.addCard(section, deckCard);
    await saveCardToDatabase(section, card);

    message = `${card.name} added to ${$selectedDeck.name}.`;
  }

  function openSearch(section: DeckSection) {
    activeSection = section;
    searchText = '';
    searchResults = [];
    message = '';
  }
</script>

<section class="deck-builder">
  <h2>Deck Builder</h2>

  {#if $selectedDeck}
    <p class="selected-deck">
      Current deck: <strong>{$selectedDeck.name}</strong>
    </p>
  {:else}
    <p class="warning">
      Please create or select a deck before adding cards.
    </p>
  {/if}

  <div class="section-list">
    <div class="section-row">
      <h3>Commander</h3>

      <button onclick={() => openSearch('Commander')} disabled={!$selectedDeck}>
        +
      </button>
    </div>

    {#each nonCommanderSections as section (section)}
      <div class="section-row">
        <h3>{section}</h3>

        <button onclick={() => openSearch(section)} disabled={!$selectedDeck}>
          +
        </button>
      </div>
    {/each}
  </div>

  {#if activeSection}
    <div class="search-panel">
      <h3>Add to {activeSection}</h3>

      <div class="search-row">
        <input
          bind:value={searchText}
          placeholder="Search card name..."
          oninput={handleLiveSearch}
          onkeydown={(event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              searchCards(activeSection as DeckSection);
            }
          }}
        />

        <button onclick={() => searchCards(activeSection as DeckSection)}>
          Search
        </button>
      </div>

      {#if isSearching}
        <p>Searching...</p>
      {/if}

      {#if searchResults.length > 0}
        <div class="results">
          {#each searchResults as card (card.id)}
            <div class="result-card">
              {#if card.image_url}
                <img src={card.image_url} alt={card.name} />
              {/if}

              <div class="card-info">
                <strong>{card.name}</strong>

                {#if card.mana_cost}
                  <p>{card.mana_cost}</p>
                {/if}

                {#if card.type_line}
                  <p>{card.type_line}</p>
                {/if}

                <button onclick={() => addCard(activeSection as DeckSection, card)}>
                  Add
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if message}
    <p class="message">{message}</p>
  {/if}
</section>

<style>
  .deck-builder {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2,
  h3 {
    margin: 0;
  }

  .selected-deck {
    font-weight: bold;
  }

  .warning,
  .message {
    color: darkred;
    font-weight: bold;
  }

  .section-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    border: 1px solid black;
    border-radius: 8px;
    padding: 0.6rem;

    background: rgba(255, 255, 255, 0.35);
  }

  .search-panel {
    border-top: 2px solid black;
    padding-top: 1rem;
  }

  .search-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid black;
    border-radius: 6px;
  }

  button {
    padding: 0.45rem 0.75rem;
    border: 1px solid black;
    border-radius: 6px;
    cursor: pointer;
    background: white;
  }

  button:disabled {
    cursor: not-allowed;
    background: #d0d0d0;
    color: #777;
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-card {
    display: flex;
    gap: 0.75rem;

    border: 1px solid black;
    border-radius: 8px;
    padding: 0.75rem;

    background: rgba(255, 255, 255, 0.45);
  }

  img {
    width: 80px;
    height: auto;
    border-radius: 6px;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-info p {
    margin: 0;
  }
</style>
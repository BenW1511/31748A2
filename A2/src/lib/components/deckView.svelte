<!-- Component for viewing user's deck -->
<script lang="ts">
  import { deckStore, nonCommanderSections } from '$lib/stores/deck';
  import type { DeckCard, DeckSection } from '$lib/stores/deck';
  import { selectedDeck } from '$lib/stores/selectedDeck';

  const daCommander = $derived($deckStore.commander);

  const visibleSections = $derived(
    nonCommanderSections.map((section) => ({section, cards: $deckStore[section]})).filter((entry) => entry.cards.length > 0)
  );

  async function removeCard(section: DeckSection, cardId: string) {
  if (!$selectedDeck){return};

  const response = await fetch( `/api/decks/${$selectedDeck.id}/cards/${cardId}`, { method: 'DELETE'});

  const data = await response.json();

  if (data.success) {deckStore.removeCard(section, cardId);} else { console.error(data.message);}
}

  function cardCount(cards: DeckCard[]) {return cards.reduce((total, card) => total + card.quantity, 0); }

  const totalCards = $derived((daCommander ? daCommander.quantity : 0) + nonCommanderSections.reduce((total, section) => total + cardCount($deckStore[section]), 0 ));
</script>

<section class="deck-view">
  <h2>Deck View</h2>

  {#if $selectedDeck}
    <p class="selected-deck">
      Current deck: <strong>{$selectedDeck.name}</strong>
    </p>
  {:else}
    <p>No deck selected.</p>
  {/if}

  <p>Total cards: {totalCards}</p>

  {#if daCommander}
    <div class="section">
      <h3>Commander</h3>

      <div class="card-row">
        {#if daCommander.image_url}
          <img src={daCommander.image_url} alt={daCommander.name} />
        {/if}

        <div class="card-info">
          <strong>{daCommander.name}</strong>

          {#if daCommander.mana_cost}
            <p>{daCommander.mana_cost}</p>
          {/if}

          {#if daCommander.type_line}
            <p>{daCommander.type_line}</p>
          {/if}
        </div>

        <button onclick={() => removeCard('Commander', daCommander.id)}>
          Remove
        </button>
      </div>
    </div>
  {/if}

  {#if visibleSections.length === 0 && !daCommander}
    <p>No cards in this deck yet.</p>
  {:else}
    {#each visibleSections as { section, cards } (section)}
      <div class="section">
        <h3>{section} ({cardCount(cards)})</h3>

        {#each cards as card (card.id)}
          <div class="card-row">
            {#if card.image_url}
              <img src={card.image_url} alt={card.name} />
            {/if}

            <div class="card-info">
              <strong>{card.name}</strong>

              {#if card.quantity > 1}
                <span>x{card.quantity}</span>
              {/if}

              {#if card.mana_cost}
                <p>{card.mana_cost}</p>
              {/if}

              {#if card.type_line}
                <p>{card.type_line}</p>
              {/if}
            </div>

            <button onclick={() => removeCard(section, card.id)}>
              Remove
            </button>
          </div>
        {/each}
      </div>
    {/each}
  {/if}
</section>

<style>
  .deck-view {
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

  .section {
    border-bottom: 1px solid black;
    padding-bottom: 1rem;
  }

  .card-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    border: 1px solid black;
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.5rem;

    background: rgba(255, 255, 255, 0.45);
  }

  img {
    width: 70px;
    height: auto;
    border-radius: 6px;
  }

  .card-info {
    flex: 1;
  }

  .card-info p {
    margin: 0.25rem 0;
  }

  button {
    padding: 0.4rem 0.7rem;
    border: 1px solid black;
    border-radius: 6px;
    cursor: pointer;
    background: white;
  }
</style>
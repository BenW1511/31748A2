<!-- Component for calculating and displaying user deck analyiics -->
<script lang="ts">
  import { deckStore, nonCommanderSections } from '$lib/stores/deck';
  import type { DeckCard } from '$lib/stores/deck';
  import { selectedDeck } from '$lib/stores/selectedDeck';

  const allCards = $derived(() => {
    const allDaCards: DeckCard[] = [];

    if ($deckStore.commander) {allDaCards.push($deckStore.commander);}

    for (const section of nonCommanderSections) {allDaCards.push(...$deckStore[section]);}
    return allDaCards;
  });

  function parseManaValue(manaCost?: string) {
    if (!manaCost){return 0};

    let totalMana = 0;
    const symbols = manaCost.replaceAll('{', '').split('}').map((symbol) => symbol.trim()).filter(Boolean);

    for (const symbol of symbols) {
      const numberValue = Number(symbol);

      if (!Number.isNaN(numberValue)) {
        totalMana += numberValue;
      } else if (symbol === 'X' || symbol === 'Y' || symbol === 'Z') {
        totalMana += 0;
      } else {
        totalMana += 1;
      }
    } return totalMana;
  }

  function getCardManaValue(card: DeckCard) {
    if (typeof card.cmc === 'number') { return card.cmc; }
    return parseManaValue(card.mana_cost);
  }

  const totalCardCount = $derived(allCards().reduce((total, card) => total + card.quantity, 0));

  const averageManaValue = $derived(() => {
    let totalMana = 0;
    let countedCards = 0;
    for (const card of allCards()) {
      const manaValue = getCardManaValue(card);
      totalMana += manaValue * card.quantity;
      countedCards += card.quantity;
    }
    if (countedCards === 0){return 0};

    return (totalMana / countedCards);
  });

  const sectionBreakdown = $derived(() => {
    const breakdown: Record<string, number> = {};

    if ($deckStore.commander) {breakdown.Commander = $deckStore.commander.quantity;}

    for (const section of nonCommanderSections) {
      breakdown[section] = $deckStore[section].reduce((total, card) => total + card.quantity, 0);
    }
    return breakdown;
  });

  const colourDistribution = $derived(() => {
    const colours: Record<string, number> = {
      White: 0,
      Blue: 0,
      Black: 0,
      Red: 0,
      Green: 0,
      Colourless: 0
    };

    for (const card of allCards()) {
      const manaCost = card.mana_cost ?? '';

      const hasWhite = manaCost.includes('W');
      const hasBlue = manaCost.includes('U');
      const hasBlack = manaCost.includes('B');
      const hasRed = manaCost.includes('R');
      const hasGreen = manaCost.includes('G');

      const hasAnyColour = (hasWhite || hasBlue || hasBlack || hasRed || hasGreen);

      if (hasWhite) colours.White += card.quantity;
      if (hasBlue) colours.Blue += card.quantity;
      if (hasBlack) colours.Black += card.quantity;
      if (hasRed) colours.Red += card.quantity;
      if (hasGreen) colours.Green += card.quantity;

      if (!hasAnyColour) {colours.Colourless += card.quantity;}
    }

    return colours;
  });

  const manaCurve = $derived(() => {
    const curve: Record<string, number> = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6+': 0
    };

    for (const card of allCards()) {
      const manaValue = getCardManaValue(card);
      const bucket = manaValue >= 6 ? '6+' : String(Math.floor(manaValue));

      curve[bucket] += card.quantity;
    }
    return curve;
  });

  const creatureSubtypes = $derived(() => {
    const subtypes: Record<string, number> = {};

    for (const card of allCards()) {
      if (!card.type_line?.includes('Creature')){continue};

      const parts = card.type_line.split('—');
      if (parts.length < 2){continue};

      const types = parts[1].trim().split(' ').map((type) => type.trim()).filter(Boolean);
      for (const type of types) {subtypes[type] = (subtypes[type] ?? 0) + card.quantity;}
    }

    return Object.entries(subtypes).sort((a, b) => b[1] - a[1]);
  });
</script>

<section class="analytics">
  <h2>Deck Analytics</h2>

  {#if $selectedDeck}
    <p class="selected-deck">
      Current deck: <strong>{$selectedDeck.name}</strong>
    </p>
  {:else}
    <p>No deck selected.</p>
  {/if}

  {#if totalCardCount === 0}
    <p>No cards available to analyse yet.</p>
  {:else}
    <div class="analytics-grid">
      <div class="analytics-card">
        <h3>Overview</h3>
        <p>Total cards: {totalCardCount}</p>
        <p>Average mana value: {averageManaValue().toFixed(2)}</p>
      </div>

      <div class="analytics-card">
        <h3>Mana Curve</h3>

        {#each Object.entries(manaCurve()) as [manaValue, count] (manaValue)}
          <p>{manaValue}: {count}</p>
        {/each}
      </div>

      <div class="analytics-card">
        <h3>Section Breakdown</h3>

        {#each Object.entries(sectionBreakdown()) as [section, count] (section)}
          <p>{section}: {count}</p>
        {/each}
      </div>

      <div class="analytics-card">
        <h3>Colour Distribution</h3>

        {#each Object.entries(colourDistribution()) as [colour, count] (colour)}
          <p>{colour}: {count}</p>
        {/each}
      </div>

      <div class="analytics-card wide">
        <h3>Creature Subtypes</h3>

        {#if creatureSubtypes().length === 0}
          <p>No creature subtypes found.</p>
        {:else}
          {#each creatureSubtypes() as [subtype, count] (subtype)}
            <p>{subtype}: {count}</p>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .analytics {
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

  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .analytics-card {
    border: 1px solid black;
    border-radius: 8px;
    padding: 1rem;

    background: rgba(255, 255, 255, 0.45);
  }

  .wide {
    grid-column: 1 / 3;
  }

  p {
    margin: 0.35rem 0;
  }
</style>
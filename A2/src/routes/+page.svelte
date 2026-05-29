<!-- SPA page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Login from '$lib/components/login.svelte';
  import DeckSelector from '$lib/components/deckSelector.svelte';
  import DeckBuilder from '$lib/components/deckBuilder.svelte';
  import DeckView from '$lib/components/deckView.svelte';
  import DeckAnalytics from '$lib/components/deckAnalytics.svelte';
  import AdminPanel from '$lib/components/adminPanel.svelte';
  import { user } from '$lib/stores/auth';
  import { rightPanelView } from '$lib/stores/ui';
  import { selectedDeck } from '$lib/stores/selectedDeck';
  import { deck } from '$lib/stores/deck';

  onMount(() => {user.loadCurrentUser();});

  function showDeckView() {
    if (!$user){return};
    rightPanelView.set('deck');
  }

  function showDeckAnalytics() {
    if (!$user) {return};
    rightPanelView.set('analytics');
  }

  async function logout() {
    await user.logout();
    selectedDeck.set(null);
    deck.reset();
  }

  function getCommanderColours() {
    const commander = $deck.commander;

    if (!commander) {return [];}
    if (commander.color_identity && commander.color_identity.length > 0) {return commander.color_identity;}

    const manaCost = commander.mana_cost ?? '';
    const colours: string[] = [];

    if (manaCost.includes('W')) colours.push('W');
    if (manaCost.includes('U')) colours.push('U');
    if (manaCost.includes('B')) colours.push('B');
    if (manaCost.includes('R')) colours.push('R');
    if (manaCost.includes('G')) colours.push('G');

    return colours;
  }

  function colourSymbolToCss(symbol: string) {
    if (symbol === 'W') {return '#f8f1d4'};
    if (symbol === 'U') {return '#3b82f6'};
    if (symbol === 'B') {return '#3f3f46'};
    if (symbol === 'R') {return '#ef4444'};
    if (symbol === 'G') {return '#22c55e'};

    return '#ffcccc';
  }

  const pageGradient = $derived.by(() => {
    const commanderColours = getCommanderColours();

    if (commanderColours.length === 0) { return 'linear-gradient(-45deg, #ffcccc, #e7c1c1, #b86575)';}
    const cssColours = commanderColours.map(colourSymbolToCss);
    if (cssColours.length === 1) {return `linear-gradient(-45deg, ${cssColours[0]}, #e7c1c1)`;}
    return `linear-gradient(-45deg, ${cssColours.join(', ')})`;
  });

  const panelGradient = $derived.by(() => {
    const commanderColours = getCommanderColours();
    if (commanderColours.length === 0) {return 'linear-gradient(-45deg, #8f4a54, #b86575, #e7c1c1)';}
    const cssColours = commanderColours.map(colourSymbolToCss);

    if (cssColours.length === 1) {return `linear-gradient(-45deg, ${cssColours[0]}, rgba(255, 255, 255, 0.65))`;}
    return `linear-gradient(-45deg, ${cssColours.join(', ')})`;
  });

  $effect(() => {if ($user && $selectedDeck) {deck.loadFromDatabase($selectedDeck.id);}});

</script>

<div
  class="page"
  style={`--page-gradient: ${pageGradient}; --panel-gradient: ${panelGradient};`}
>
  <div class="top-bar">
    <p class="debug-user">
      Welcome User: {$user ? `${$user.username} ` : 'none'}
    </p>


    <button onclick={showDeckView} disabled={!$user}>
      Deck View
    </button>

    <button onclick={showDeckAnalytics} disabled={!$user}>
      Deck Analytics
    </button>

    <button onclick={logout} disabled={!$user}>
      Logout
    </button>
  </div>

  <div class="panels">
    <div class="left">
      {#if $user?.role === 'admin'}
        <AdminPanel />
      {:else if $user}
        <DeckSelector />
        <DeckBuilder />
      {:else}
        <Login mode="login" />
      {/if}
    </div>

    <div class="right">
      {#if $user?.role === 'admin'}
        <DeckBuilder />

        {#if $rightPanelView === 'deck'}
          <DeckView />
        {:else if $rightPanelView === 'analytics'}
          <DeckAnalytics />
        {/if}
      {:else if $user}
        {#if $rightPanelView === 'deck'}
          <DeckView />
        {:else if $rightPanelView === 'analytics'}
          <DeckAnalytics />
        {/if}
      {:else}
        <Login mode="register" />
      {/if}
    </div>
  </div>
</div>

<style>
  .page {
    height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
    background: var(--page-gradient);
    transition: background 0.4s ease;
  }

  .top-bar {
    display: flex;
    gap: 0.75rem;
    align-items: center;

    border: 2px solid black;
    padding: 1rem;

    background: var(--panel-gradient);
    backdrop-filter: blur(4px);
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    transition: background 0.4s ease;
  }

  .debug-user {
    margin-right: auto;
    font-weight: bold;
  }

  .top-bar button {
    padding: 0.65rem 1rem;
    border: 1px solid black;
    border-radius: 8px;
    cursor: pointer;
    background-color: white;
    color: black;
  }

  .top-bar button:disabled {
    background-color: #d0d0d0;
    color: #777;
    border-color: #999;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .panels {
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .left,
  .right {
    min-height: 0;
    border: 2px solid black;
    padding: 1rem;
    overflow: auto;

    background: var(--panel-gradient);
    backdrop-filter: blur(4px);
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    transition: background 0.4s ease;
  }
</style> 
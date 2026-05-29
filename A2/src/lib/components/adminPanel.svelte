<!-- Component used to display Admin functionality -->
<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { selectedDeck } from '$lib/stores/selectedDeck';
  import { deckStore } from '$lib/stores/deck';
  import { rightPanelView } from '$lib/stores/ui';

  type AdminUser = {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at?: string;
  };

  type AdminDeck = {
    id: number;
    user_id: number;
    name: string;
    commander_card_id: string | null;
    createdAt: string;
    updatedAt: string;
  };

  let users = $state<AdminUser[]>([]);
  let userDecks = $state<AdminDeck[]>([]);
  let message = $state('');
  let greatSuccess = $state(false);
  let isLoading = $state(false);

  async function loadAdminData() {
    if (!$user || $user.role !== 'admin') { message = 'Admin access required.'; greatSuccess = false; return;}
    isLoading = true;
    message = '';

    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.success) {
        users = data.users;
        userDecks = data.userDecks;
        message = 'Admin data loaded.';
        greatSuccess = true;
      } else {
        message = data.error ?? data.message ?? 'Failed to load admin data.';
        greatSuccess = false;
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      message = 'Failed to load admin data.';
      greatSuccess = false;
    } finally { isLoading = false;}
  }

  async function viewDeck(deck: AdminDeck) {
    selectedDeck.set({
      id: deck.id,
      user_id: deck.user_id,
      name: deck.name,
      commander_card_id: deck.commander_card_id,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt
    });

    await deckStore.loadFromDatabase(deck.id);
    rightPanelView.set('deck');
    message = `Loaded deck: ${deck.name}`;
    greatSuccess = true;
  }

  async function updateUser(appUser: AdminUser) {
    if (!$user || $user.role !== 'admin') { message = 'Admin access required.'; greatSuccess = false; return; }

    if (!appUser.username.trim() || !appUser.email.trim()) {
      message = 'Username and email cannot be empty.';
      greatSuccess = false;
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${appUser.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: appUser.username.trim(),
          email: appUser.email.trim().toLowerCase(),
          newRole: appUser.role
        })
      });

      const data = await response.json();

      if (data.success) {
        message = 'User updated successfully.';
        greatSuccess = true;
        await loadAdminData();
      } else {
        message = data.error ?? data.message ?? 'Failed to update user.';
        greatSuccess = false;
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      message = 'Failed to update user.';
      greatSuccess = false;
    }
  }

  async function deleteUser(userId: number) {
    if (!$user || $user.role !== 'admin') {
      message = 'Admin access required.';
      greatSuccess = false;
      return;
    }

    if (userId === $user.id) {
      message = 'You cannot delete your own admin account while logged in.';
      greatSuccess = false; return;
    }

    const confirmed = confirm('Are you sure you want to delete this user and all of their decks?');

    if (!confirmed){ return};

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {method: 'DELETE'});
      const data = await response.json();

      if (data.success) {
        message = 'User deleted successfully.';
        greatSuccess = true;
        await loadAdminData();

      } else {
        message = data.error ?? data.message ?? 'Failed to delete user.';
        greatSuccess = false;
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      message = 'Failed to delete user.';
      greatSuccess = false;
    }
  }

  async function deleteDeck(deckId: number) {
    if (!$user || $user.role !== 'admin') {
      message = 'Admin access required.';
      greatSuccess = false;
      return;
    }

    const confirmed = confirm('Are you sure you want to delete this deck?');

    if (!confirmed){return};

    try {
      const response = await fetch(`/api/admin/decks/${deckId}`, {method: 'DELETE'});
      const data = await response.json();

      if (data.success) {
        message = 'Deck deleted successfully.';
        greatSuccess = true;

        if ($selectedDeck?.id === deckId) {
          selectedDeck.set(null);
          deckStore.reset();
        }
        await loadAdminData();

      } else {
        message = data.error ?? data.message ?? 'Failed to delete deck.';
        greatSuccess = false;
      }
    } catch (error) {
      console.error('Failed to delete deck:', error);
      message = 'Failed to delete deck.';
      greatSuccess = false;
    }
  }

  function getDecksForUser(userId: number) { return userDecks.filter((deck) => deck.user_id === userId); }

  $effect(() => {
    if ($user?.role === 'admin') {
      loadAdminData();
    }});
</script>

<section class="admin-panel">
  <div class="admin-header">
    <h2>Admin Panel</h2>

    <button onclick={loadAdminData} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  {#if message}
    <p class:success={greatSuccess} class:error={!greatSuccess}>
      {message}
    </p>
  {/if}

  {#if isLoading}
    <p>Loading admin data...</p>
  {:else if users.length === 0}
    <p>No users found.</p>
  {:else}
    {#each users as appUser (appUser.id)}
      {@const userDecks = getDecksForUser(appUser.id)}

      <div class="user-card">
        <div class="user-header">
          <div>
            <h3>{appUser.username}</h3>
            <p>User ID: {appUser.id}</p>
            <p>Decks: {userDecks.length}</p>
          </div>

          <button
            class="delete-button"
            onclick={() => deleteUser(appUser.id)}
            disabled={appUser.id === $user?.id}
          >
            Delete User
          </button>
        </div>

        <div class="edit-fields">
          <label>
            Username
            <input bind:value={appUser.username} />
          </label>

          <label>
            Email
            <input bind:value={appUser.email} type="email" />
          </label>

          <label>
            Role
            <select bind:value={appUser.role}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <button onclick={() => updateUser(appUser)}>
            Save User Changes
          </button>
        </div>

        <h4>User Decks</h4>

        {#if userDecks.length === 0}
          <p>This user has no decks.</p>
        {:else}
          {#each userDecks as deck (deck.id)}
            <div class="deck-row">
              <div>
                <strong>{deck.name}</strong>
                <p>Deck ID: {deck.id}</p>
                <p>User ID: {deck.user_id}</p>
              </div>

              <div class="deck-actions">
                <button onclick={() => viewDeck(deck)}>
                  View/Edit Deck
                </button>

                <button
                  class="delete-button"
                  onclick={() => deleteDeck(deck.id)}
                >
                  Delete Deck
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/each}
  {/if}
</section>

<style>
  .admin-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  h2,
  h3,
  h4 {
    margin: 0;
  }

  .success {
    font-weight: bold;
    color: darkgreen;
  }

  .error {
    font-weight: bold;
    color: darkred;
  }

  .user-card {
    border: 2px solid black;
    border-radius: 10px;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.45);
  }

  .user-header,
  .deck-row,
  .deck-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .edit-fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-weight: bold;
  }

  input,
  select {
    padding: 0.45rem;
    border: 1px solid black;
    border-radius: 6px;
  }

  .deck-row {
    border: 1px solid black;
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: rgba(255, 255, 255, 0.35);
  }

  p {
    margin: 0.3rem 0;
  }

  button {
    padding: 0.5rem 0.75rem;
    border: 1px solid black;
    border-radius: 6px;
    cursor: pointer;
    background: white;
  }

  .delete-button {
    background: #ffe1e1;
  }

  button:disabled {
    cursor: not-allowed;
    background: #d0d0d0;
    color: #777;
  }
</style>
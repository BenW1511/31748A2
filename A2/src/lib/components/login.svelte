<!-- Component for hadnling user logging/registering in -->
<script lang="ts">
  import { user } from '$lib/stores/auth';

  let { mode }: { mode: 'login' | 'register' } = $props();

  let inputUsername = $state('');
  let inputEmail = $state('');
  let inputPassword = $state('');

  let message = $state('');
  let successfulVar = $state(false);

  const allowedEmailDomains = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'yahoo.com', 
    'uts.edu.au',
    'student.uts.edu.au'
  ];

  function isAllowedEmail(emailAddress: string) {
    const trimmedEmail = emailAddress.trim().toLowerCase();

    if (!trimmedEmail.includes('@')) {return false;}

    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) { return false;}
    const domain = parts[1];
    return allowedEmailDomains.includes(domain);
  }

  async function register() {
    message = '';
    successfulVar = false;

    if (!inputUsername.trim() || !inputEmail.trim() || !inputPassword.trim()) {
      message = 'Please fill in all fields.'; return;
    }

    if (!isAllowedEmail(inputEmail)) { message = 'Email must use Gmail, Hotmail, Outlook, Live, Yahoo, or UTS domain.'; return; }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({username: inputUsername.trim(), email: inputEmail.trim().toLowerCase(), password: inputPassword.trim()})
      });

      const data = await response.json();
      if (data.success) {
        successfulVar = true;
        message = 'Registration successful. You can now log in using the left panel.';
        inputUsername = '';
        inputEmail = '';
        inputPassword = '';
      } else {
        successfulVar = false;
        message = data.error ?? data.message ?? 'Registration failed.';
      }

    } catch (error) {
      console.error('Registration error:', error);
      successfulVar = false;
      message = 'Registration failed.';
    }
  }

  async function login() {
    message = '';
    successfulVar = false;

    if (!inputEmail.trim() || !inputPassword.trim()) {message = 'Please enter your email and password.'; return; }

    if (!isAllowedEmail(inputEmail)) { message = 'Email must use Gmail, Hotmail, Outlook, Live, Yahoo, or UTS domain.'; return;}

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail.trim().toLowerCase(), password: inputPassword.trim()})
      });

      const data = await response.json();

      if (data.success) {
        user.login(data.user);
        successfulVar = true;
        message = 'Login successful.';
        inputEmail = '';
        inputPassword = '';
      } else {
        successfulVar = false;
        message = data.error ?? data.message ?? 'Login failed.';
      }
    } catch (error) {
      console.error('Login error:', error);
      successfulVar = false;
      message = 'Login failed.';
    }
  }
</script>

<section class="auth-panel">
  {#if mode === 'login'}
    <h2>Login</h2>

    <label>
      Email
      <input bind:value={inputEmail} type="email" />
    </label>

    <label>
      Password
      <input bind:value={inputPassword} type="password" />
    </label>

    <button onclick={login}>
      Login
    </button>
  {:else}
    <h2>Register</h2>

    <label>
      Username
      <input bind:value={inputUsername} type="text" />
    </label>

    <label>
      Email
      <input bind:value={inputEmail} type="email" />
    </label>

    <label>
      Password
      <input bind:value={inputPassword} type="password" />
    </label>

    <button onclick={register}>
      Register
    </button>
  {/if}

  {#if message}
    <p class:success={successfulVar} class:error={!successfulVar}>
      {message}
    </p>
  {/if}
</section>

<style>
  .auth-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    margin-top: 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: bold;
  }

  input {
    padding: 0.6rem;
    border: 1px solid black;
    border-radius: 6px;
  }

  button {
    padding: 0.7rem 1rem;
    border: 1px solid black;
    border-radius: 8px;
    cursor: pointer;
    background: white;
    color: black;
  }

  .success {
    color: darkgreen;
    font-weight: bold;
  }

  .error {
    color: darkred;
    font-weight: bold;
  }
</style>
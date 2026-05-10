<script>
  import { restaurantStore } from "../stores/restaurantStore";

  let mode = "login";   // "login" | "register"
  let email    = "";
  let password = "";
  let name     = "";
  let role     = "Cliente";
  let error    = "";
  let loading  = false;

  const ROLES = ["Cliente", "Mesero", "Administrador"];

  const DEMO = [
    { role: "Administrador", email: "admin@sabormesa.com",   password: "admin123"   },
    { role: "Mesero",        email: "mesero@sabormesa.com",  password: "mesero123"  },
    { role: "Cliente",       email: "cliente@sabormesa.com", password: "cliente123" }
  ];

  function fillDemo(d) {
    email    = d.email;
    password = d.password;
    mode     = "login";
    error    = "";
  }

  async function submit() {
    error   = "";
    loading = true;

    if (mode === "login") {
      if (!email.trim() || !password) { error = "Completa correo y contraseña."; loading = false; return; }
      const result = await restaurantStore.login(email.trim(), password);
      if (!result.ok) error = result.message;
    } else {
      if (!name.trim() || !email.trim() || !password) { error = "Completa todos los campos."; loading = false; return; }
      if (password.length < 6) { error = "La contraseña debe tener al menos 6 caracteres."; loading = false; return; }
      const result = await restaurantStore.register(name.trim(), email.trim(), password, role);
      if (!result.ok) error = result.message;
    }
    loading = false;
  }

  function switchMode(m) {
    mode  = m;
    error = "";
  }
</script>

<div class="auth-wrap">
  <div class="auth-bg"></div>

  <div class="auth-card">
    <!-- Brand -->
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
      </div>
      <div>
        <h1>Sabor &amp; Mesa</h1>
        <p>Sistema de gestión de restaurante</p>
      </div>
    </div>

    <!-- Mode toggle -->
    <div class="mode-toggle">
      <button class="toggle-btn {mode === 'login' ? 'active' : ''}" on:click={() => switchMode("login")}>
        Iniciar sesión
      </button>
      <button class="toggle-btn {mode === 'register' ? 'active' : ''}" on:click={() => switchMode("register")}>
        Registrarse
      </button>
    </div>

    <!-- Form -->
    <form on:submit|preventDefault={submit} class="auth-form">
      {#if mode === "register"}
        <label>
          <span>Nombre completo</span>
          <input
            type="text"
            placeholder="Tu nombre"
            bind:value={name}
            autocomplete="name"
            required
          />
        </label>
      {/if}

      <label>
        <span>Correo electrónico</span>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          bind:value={email}
          autocomplete="email"
          required
        />
      </label>

      <label>
        <span>Contraseña</span>
        <input
          type="password"
          placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
          bind:value={password}
          autocomplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      {#if mode === "register"}
        <label>
          <span>Tipo de cuenta</span>
          <select bind:value={role}>
            {#each ROLES as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
        </label>
      {/if}

      {#if error}
        <p class="auth-error">{error}</p>
      {/if}

      <button type="submit" class="btn-submit" disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
        {:else if mode === "login"}
          Entrar al sistema
        {:else}
          Crear cuenta
        {/if}
      </button>
    </form>

    <!-- Demo credentials -->
    <details class="demo-section">
      <summary>Usuarios de demostración</summary>
      <div class="demo-grid">
        {#each DEMO as d}
          <button class="demo-chip role-{d.role.toLowerCase()}" on:click={() => fillDemo(d)}>
            <strong>{d.role}</strong>
            <span>{d.email}</span>
          </button>
        {/each}
      </div>
    </details>
  </div>
</div>

<style>
  .auth-wrap {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 100;
    padding: 1rem;
  }

  .auth-bg {
    position: absolute;
    inset: 0;
    background:
      url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80")
      center/cover no-repeat;
  }
  .auth-bg::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(15, 10, 5, 0.88), rgba(215, 78, 9, 0.55));
  }

  .auth-card {
    position: relative;
    width: min(440px, 100%);
    background: rgba(255, 252, 247, 0.97);
    border-radius: 20px;
    padding: 2rem 2rem 1.5rem;
    box-shadow: 0 32px 64px rgba(10, 6, 3, 0.45);
    animation: slide-up .4s cubic-bezier(.22,1,.36,1);
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: none; }
  }

  /* Brand */
  .brand {
    display: flex;
    align-items: center;
    gap: .85rem;
    margin-bottom: 1.6rem;
  }
  .brand-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary), var(--primary-2));
    display: grid;
    place-items: center;
    flex-shrink: 0;
    box-shadow: 0 8px 18px rgba(215, 78, 9, 0.38);
  }
  .brand-icon svg { width: 26px; height: 26px; fill: #fff; }
  .brand h1 { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); line-height: 1.2; }
  .brand p  { margin: 0; font-size: .78rem; color: var(--muted); }

  /* Toggle */
  .mode-toggle {
    display: flex;
    gap: .4rem;
    background: #f0ebe1;
    border-radius: 10px;
    padding: .3rem;
    margin-bottom: 1.4rem;
  }
  .toggle-btn {
    flex: 1;
    border: none;
    border-radius: 8px;
    padding: .55rem;
    cursor: pointer;
    font: inherit;
    font-size: .9rem;
    font-weight: 600;
    color: var(--muted);
    background: transparent;
    transition: background .2s, color .2s, box-shadow .2s;
  }
  .toggle-btn.active {
    background: #fff;
    color: var(--primary);
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
  }

  /* Form */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: .85rem;
  }
  .auth-form label {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    font-size: .87rem;
    font-weight: 600;
    color: #4a3520;
  }
  .auth-form input,
  .auth-form select {
    width: 100%;
    border: 1.5px solid #e0d4c0;
    border-radius: 10px;
    padding: .7rem .9rem;
    font: inherit;
    font-size: .95rem;
    background: #fffdf8;
    transition: border-color .2s, box-shadow .2s;
  }
  .auth-form input:focus,
  .auth-form select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(215, 78, 9, 0.15);
  }

  .auth-error {
    margin: 0;
    padding: .6rem .8rem;
    background: #ffe8e4;
    border: 1px solid #f5c0b4;
    border-radius: 8px;
    color: var(--danger);
    font-size: .88rem;
    font-weight: 500;
  }

  .btn-submit {
    width: 100%;
    padding: .8rem;
    border: none;
    border-radius: 11px;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff;
    font: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    margin-top: .2rem;
    box-shadow: 0 8px 20px rgba(215, 78, 9, 0.38);
    transition: opacity .2s, transform .15s;
  }
  .btn-submit:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: .65; cursor: not-allowed; }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Demo section */
  .demo-section {
    margin-top: 1.2rem;
    border-top: 1px dashed #e0d4c0;
    padding-top: .9rem;
  }
  .demo-section summary {
    cursor: pointer;
    font-size: .83rem;
    color: var(--muted);
    font-weight: 600;
    user-select: none;
    list-style: none;
  }
  .demo-section summary::after { content: " ▾"; }
  .demo-section[open] summary::after { content: " ▴"; }

  .demo-grid {
    display: flex;
    flex-direction: column;
    gap: .45rem;
    margin-top: .75rem;
  }
  .demo-chip {
    display: flex;
    align-items: center;
    gap: .65rem;
    border: 1.5px solid #e5d7bf;
    border-radius: 9px;
    background: #fffdf8;
    padding: .5rem .75rem;
    cursor: pointer;
    text-align: left;
    width: 100%;
    font: inherit;
    transition: border-color .2s, background .2s;
  }
  .demo-chip:hover { background: #fff6e6; }
  .demo-chip strong {
    font-size: .8rem;
    padding: .18rem .55rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .demo-chip span { font-size: .82rem; color: var(--muted); }

  .demo-chip.role-administrador strong { background: #ffe4d4; color: #c0380a; }
  .demo-chip.role-mesero strong        { background: #fef0d4; color: #9a5f00; }
  .demo-chip.role-cliente strong       { background: #d4f4e6; color: #0d6b3e; }
</style>

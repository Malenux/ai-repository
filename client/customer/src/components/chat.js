class Chat extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.socket = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080')
    this.socketReady = false
    this.userName = localStorage.getItem('usuarioName') || null
  }

  connectedCallback () {
    this.render()
    this.addEventListeners()

    if (!this.userName) {
      this.shadow.querySelector('.modal-welcome').classList.add('visible')
    } else {
      this.updateUserUI(this.userName)
    }

    this.socket.addEventListener('open', () => {
      this.socketReady = true
      this.wsSubscribe('colectivo')
      if (this.userName) {
        this.wsSend({
          channel: 'colectivo',
          data: JSON.stringify({ event: 'user_connected', data: { user: this.userName } })
        })
      }
    })

    this.socket.addEventListener('message', event => {
      const data = JSON.parse(event.data)
      if (data.channel === 'colectivo') {
        try {
          const inner = JSON.parse(data.data)
          if (inner.event === 'new_message' && inner.data.user !== this.userName) {
            this.createIncomingMessage(inner.data.user, inner.data.prompt)
          } else if (inner.event === 'user_connected') {
            this.createSystemMessage(` ○( ＾皿＾)っ Hehehe… ${inner.data.user} se ha conectado.`)
          }
        } catch (err) {
          console.error('❌ Error parseando mensaje WS', err)
        }
      }
    })

    this.socket.addEventListener('close', () => { this.socketReady = false })
    this.socket.addEventListener('error', () => { this.socketReady = false })
  }

  // --- Métodos para WebSockets ---
  wsSend (obj) {
    if (!this.socketReady) return
    this.socket.send(JSON.stringify(obj))
  }

  wsSubscribe (channel) { this.wsSend({ type: 'subscribe', channel }) }

  // --- Lógica del Chat ---
  sendMessage () {
    const chatInput = this.shadow.querySelector('.chat-input')
    const message = chatInput.value.trim()
    if (!message || !this.userName) return

    this.createUserMessage(this.userName, message)
    chatInput.value = ''
    chatInput.focus()

    const payload = {
      channel: 'colectivo',
      data: JSON.stringify({ event: 'new_message', data: { prompt: message, user: this.userName } })
    }
    this.wsSend(payload)
  }

  createIncomingMessage (user, text) {
    this.removeWelcomeMessage()
    const chatMessages = this.shadow.querySelector('.chat-messages')

    // Verificar si el último mensaje es del mismo usuario
    const lastMessage = chatMessages.lastElementChild
    if (
      lastMessage &&
    lastMessage.classList.contains('prompt') &&
    lastMessage.classList.contains('incoming') &&
    lastMessage.dataset.user === user
    ) {
    // Ya existe un bloque del mismo usuario → solo agregamos el nuevo texto
      const content = lastMessage.querySelector('.message-content')
      const newParagraph = document.createElement('p')
      newParagraph.textContent = text
      content.appendChild(newParagraph)
    } else {
    // Nuevo bloque de usuario
      const messageHTML = `
      <div class="prompt incoming" data-user="${user}">
        <div class="avatar">${user[0].toUpperCase()}</div>
        <div class="message-content">
          <h3>${user}</h3>
          <p>${text}</p>
        </div>
      </div>`
      chatMessages.insertAdjacentHTML('beforeend', messageHTML)
    }

    this.scrollToBottom()
  }

  createUserMessage (user, text) {
    this.removeWelcomeMessage()
    const chatMessages = this.shadow.querySelector('.chat-messages')

    // Verificar si el último mensaje es del mismo usuario
    const lastMessage = chatMessages.lastElementChild
    if (
      lastMessage &&
    lastMessage.classList.contains('prompt') &&
    lastMessage.classList.contains('user') &&
    lastMessage.dataset.user === user
    ) {
    // Agrupar en el mismo bloque
      const content = lastMessage.querySelector('.message-content')
      const newParagraph = document.createElement('p')
      newParagraph.textContent = text
      content.appendChild(newParagraph)
    } else {
    // Crear bloque nuevo
      const messageHTML = `
      <div class="prompt user" data-user="${user}">
        <div class="avatar user-avatar">${user[0].toUpperCase()}</div>
        <div class="message-content">
          <h3>${user}</h3>
          <p>${text}</p>
        </div>
      </div>`
      chatMessages.insertAdjacentHTML('beforeend', messageHTML)
    }

    this.scrollToBottom()
  }

  createSystemMessage (text) {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const sysMsg = document.createElement('div')
    sysMsg.className = 'system-message'
    sysMsg.textContent = text
    chatMessages.appendChild(sysMsg)
    this.scrollToBottom()
  }

  removeWelcomeMessage () {
    const welcome = this.shadow.querySelector('.welcome-message')
    if (welcome) welcome.remove()
  }

  scrollToBottom () {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // --- Manejo de Usuario y Modales ---
  handleSetUsername (modalSelector, inputSelector) {
    const modal = this.shadow.querySelector(modalSelector)
    const input = this.shadow.querySelector(inputSelector)
    const newName = input.value.trim()

    if (newName) {
      const oldName = this.userName
      this.userName = newName
      localStorage.setItem('usuarioName', newName)

      this.updateUserUI(newName)

      if (oldName && oldName !== newName) {
        this.createSystemMessage(`Has cambiado tu nombre a "${newName}".`)
      } else if (!oldName) {
        this.wsSend({
          channel: 'colectivo',
          data: JSON.stringify({ event: 'user_connected', data: { user: newName } })
        })
      }

      modal.classList.remove('visible')
    } else {
      input.placeholder = '¡El nombre no puede estar vacío!'
      input.focus()
    }
  }

  updateUserUI (name) {
    const userAvatar = this.shadow.querySelector('.footer-user-avatar')
    if (userAvatar) {
      userAvatar.textContent = name[0].toUpperCase()
    }
  }

  // --- Renderizado y Eventos ---
  addEventListeners () {
    this.shadow.querySelector('.send-button').addEventListener('click', () => this.sendMessage())
    this.shadow.querySelector('.chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage() }
    })

    this.shadow.querySelector('.welcome-modal-button').addEventListener('click', () => {
      this.handleSetUsername('.modal-welcome', '.welcome-modal-input')
    })
    this.shadow.querySelector('.welcome-modal-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSetUsername('.modal-welcome', '.welcome-modal-input')
    })

    this.shadow.querySelector('.footer-user-button').addEventListener('click', () => {
      this.shadow.querySelector('.change-name-modal-input').value = this.userName
      this.shadow.querySelector('.modal-change-name').classList.add('visible')
    })

    this.shadow.querySelector('.change-name-modal-button').addEventListener('click', () => {
      this.handleSetUsername('.modal-change-name', '.change-name-modal-input')
    })

    this.shadow.querySelector('.change-name-modal-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSetUsername('.modal-change-name', '.change-name-modal-input')
    })

    this.shadow.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.classList.remove('visible') }
      })
    })
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        :host { 
          --color-bg-main:hsl(0, 0.00%, 3.90%);           
          --color-bg-secondary:hsl(0, 0.00%, 6.30%);      
          --color-bg-panel:hsl(0, 0.00%, 7.10%);          
          --color-bg-chat:hsl(0, 0.00%, 7.80%);           
          --color-bg-input:hsl(0, 0.00%, 10.20%);          
          --color-accent: hsl(211, 100.00%, 50.00%);            
          --color-accent-light:hsl(209, 44.80%, 53.10%);      
          --color-accent-dark:rgb(0, 49, 105);       
          --color-border:hsl(0, 0.00%, 16.50%);            
          --color-text:hsl(0, 0.00%, 90.20%);              
          --color-text-secondary:hsl(0, 0.00%, 62.70%);    
          --color-scroll-thumb:hsl(0, 0.00%, 22.70%);      
          --color-scroll-track:hsl(0, 0.00%, 10.20%);      
          --color-status-online: hsl(200, 100.00%, 50.00%);     
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background-color: var(--color-bg-main);
        }
        * { padding: 0; margin: 0; box-sizing: border-box; }
        .main-container { display: flex; flex: 1; overflow: hidden; }

        /* PANEL IZQUIERDO */

        .left-panel { padding: 0.5em 0; align-items: center; width: 3.75rem; display: flex; flex-direction: column; background-color: var(--color-bg-main); gap: 1em; }
        .left-panel .icon-general svg { 
          cursor: pointer; 
          height: 1.56rem; 
          width: auto; 
          color: white; 
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); 
          padding: 0.5em; 
          border-radius: 0.8em;
        }
        .left-panel .icon-create svg {
          background-color: var(--color-bg-panel);
          color: var(--color-accent);
          border: 0.13rem solid var(--color-accent);
          border-radius: 2em;
          padding: 0.5em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .left-panel .icon-create svg:hover { background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: white; border-color: white; }

        /* PANEL DERECHO */

        .right-panel { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          background-color: var(--color-bg-chat); 
          border-top-left-radius: 0.5rem; 
          border-bottom-left-radius: 0.5rem; 
          overflow: hidden; 
          box-shadow: -0.13rem 0 0.31rem rgba(0,0,0,0.5);
        }
        .chat-header { 
          padding: 1em 1.5em; 
          border-bottom: 0.06rem solid var(--color-border); 
          color: var(--color-text); 
          font-weight: bold; 
        }
        .chat-messages {
          color: var(--color-text);
          flex: 1;
          padding: 1.25em;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.2em;
        }
        .chat-messages::-webkit-scrollbar { width: 0.38rem; }
        .chat-messages::-webkit-scrollbar-track { background: var(--color-scroll-track); }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--color-scroll-thumb); border-radius: 0.19rem; }
        .welcome-message, 
        .system-message { 
          text-align: center; 
          color: var(--color-text-secondary); 
          font-size: 0.9em; 
          margin: auto; 
        }

        /* MENSAJES */

        .prompt { display: flex; gap: 1em; align-items: flex-start; }
        .prompt .message-content p + p { margin-top: 1.5em; }
        .prompt.user {
          justify-content: flex-end;
          flex-direction: row-reverse;
          align-items: flex-start;
          justify-content: flex-start;
        }
        .prompt.user .avatar {
          flex-shrink: 0;
        }
        .prompt.user .message-content h3 {
          text-align: right;
          margin-bottom: 0.3em;
          font-size: 0.85em;
          opacity: 0.8;
        }
        .prompt.user .message-content p {
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
          color: white;
          padding: 0.75em 1em;
          border-radius: 1rem;
          border-top-right-radius: 0;
        }
        .prompt.incoming .message-content p {
          background: linear-gradient(135deg, var(--color-accent-dark), var(--color-accent));
          color: white;
          padding: 0.75em 1em;
          border-radius: 1rem;
          border-top-left-radius: 0;
        }
        .avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent-dark), var(--color-accent));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }
        .avatar.user-avatar { background: linear-gradient(135deg, var(--color-accent-light), var(--color-accent)); }
        .message-content h3 { 
          font-size: 1em; 
          margin: 0 0 0.25em; 
          color: var(--color-text); 
        }
        .message-content p { 
          font-size: 1em; 
          margin: 0; 
          color: var(--color-text-secondary); 
          line-height: 1.5; 
          white-space: pre-wrap; 
        }

        /* INPUT */

        .input-area {
          padding: 1em 1.5em;
          background: var(--color-bg-panel);
          display: flex;
          gap: 0.63em;
          align-items: center;
        }
        .chat-input {
          flex: 1;
          padding: 0.75em 1em;
          border: 0.06rem solid var(--color-border);
          border-radius: 0.5rem;
          font-size: 1em;
          outline: none;
          transition: border-color 0.2s;
          background: var(--color-bg-input);
          color: var(--color-text);
          resize: vertical;
          max-height: 9.38rem;
          overflow-y: auto;
        }
        .chat-input:focus { border-color: var(--color-accent); }

        /* SCROLLBAR PERSONALIZADA PARA INPUT */

        .chat-input::-webkit-scrollbar { width: 0.38rem; }
        .chat-input::-webkit-scrollbar-track { background: var(--color-scroll-track); }
        .chat-input::-webkit-scrollbar-thumb { background: var(--color-scroll-thumb); border-radius: 0.19rem; }
        .send-button {
          background: linear-gradient(135deg, var(--color-accent-dark), var(--color-accent));
          color: white;
          border: none;
          width: 2.81rem;
          height: 2.81rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 1em;
          flex-shrink: 0;
        }
        .send-button:hover { background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); }

        /* FOOTER */
        
        .footer {
          height: 4.5rem;
          background-color: var(--color-bg-panel);
          color: var(--color-text-secondary);
          font-size: 0.8em;
          border-top: 0.06rem solid var(--color-border);
        }
        .footer ul {
          height: 100%;
          padding: 0.5em;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          list-style: none;
          justify-items: center;
          align-items: center;
        }
        .footer li {
          cursor: pointer;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25em;
        }
        .footer li.active { color: var(--color-text); }
        .footer svg { height: 1.56rem; width: auto; }
        .footer-user-icon-wrapper {
          position: relative;
          width: 1.56rem;
          height: 1.56rem;
          margin-bottom: 0.13em;
        }
        .footer-user-avatar {
          width: 100%;
          height: 100%;
          background-color: var(--color-scroll-thumb);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8em;
          font-weight: bold;
        }
        .status {
          position: absolute;
          bottom: -0.13rem;
          right: -0.13rem;
          height: 0.63rem;
          width: 0.63rem;
          border-radius: 50%;
          border: 0.13rem solid var(--color-bg-panel);
        }
        .status.disponible { background-color: var(--color-status-online); }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .modal-overlay.visible { opacity: 1; pointer-events: auto; }
        .modal-content {
          background: var(--color-bg-panel);
          color: var(--color-text);
          padding: 2em;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 25rem;
          text-align: center;
        }
        .modal-content h2 { margin-bottom: 1em; }
        .modal-content p { margin-bottom: 1.5em; color: var(--color-text-secondary); }
        .modal-input {
          width: 100%;
          padding: 0.75em;
          border-radius: 0.31rem;
          border: 0.06rem solid var(--color-border);
          background: var(--color-bg-input);
          color: white;
          font-size: 1em;
          margin-bottom: 1.5em;
        }
        .modal-button {
          width: 100%;
          padding: 0.75em;
          border: none;
          border-radius: 0.31rem;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));
          color: white;
          font-size: 1em;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .modal-button:hover { background: var(--color-accent-light); }

      </style>


      <!-- MODAL DE BIENVENIDA -->
      <div class="modal-overlay modal-welcome">
        <div class="modal-content">
          <h2>¡Bienvenido al Chat!</h2>
          <p>Para continuar, por favor introduce tu nombre de usuario.</p>
          <input type="text" class="modal-input welcome-modal-input" placeholder="Tu nombre...">
          <button class="modal-button welcome-modal-button">Entrar al Chat</button>
        </div>
      </div>
      
      <!-- MODAL PARA CAMBIAR NOMBRE -->
      <div class="modal-overlay modal-change-name">
        <div class="modal-content">
          <h2>Cambiar Nombre</h2>
          <p>Introduce tu nuevo nombre de usuario.</p>
          <input type="text" class="modal-input change-name-modal-input">
          <button class="modal-button change-name-modal-button">Guardar Cambios</button>
        </div>
      </div>

      <!-- ESTRUCTURA PRINCIPAL DEL CHAT -->
      <div class="main-container">
        <div class="left-panel">
          <div class="icon-general"><svg viewBox="0 0 1024 1024"><path fill="currentColor" d="M924.3 338.4a447.6 447.6 0 0 0-96.1-143.3a443.1 443.1 0 0 0-143-96.3A443.9 443.9 0 0 0 512 64h-2c-60.5.3-119 12.3-174.1 35.9a444.1 444.1 0 0 0-141.7 96.5a445 445 0 0 0-95 142.8A449.9 449.9 0 0 0 65 514.1c.3 69.4 16.9 138.3 47.9 199.9v152c0 25.4 20.6 46 45.9 46h151.8a447.7 447.7 0 0 0 199.5 48h2.1c59.8 0 117.7-11.6 172.3-34.3A443.2 443.2 0 0 0 827 830.5c41.2-40.9 73.6-88.7 96.3-142c23.5-55.2 35.5-113.9 35.8-174.5c.2-60.9-11.6-120-34.8-175.6M312.4 560c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48s47.9 21.5 47.9 48s-21.4 48-47.9 48m199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48s47.9 21.5 47.9 48s-21.5 48-47.9 48m199.6 0c-26.4 0-47.9-21.5-47.9-48s21.5-48 47.9-48s47.9 21.5 47.9 48s-21.5 48-47.9 48"/></svg></div>
          <div class="icon-create"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg></div>
        </div>
        <div class="right-panel">
          <header class="chat-header"># General</header>
          <div class="chat-messages">
            <div class="welcome-message">Introduce tu nombre para empezar a chatear.</div>
          </div>
          <div class="input-area">
            <textarea type="text" class="chat-input" placeholder="Escribe tu mensaje en #General..." required></textarea>
            <button class="send-button" title="Enviar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9"></polygon></svg></button>
          </div>
        </div>
      </div>

      <!-- FOOTER CON HTML CORREGIDO -->
      <footer class="footer">
        <ul>
          <li class="active">
            <svg viewBox="0 0 512 512"><path fill="currentColor" d="M234.2 8.6c12.3-11.4 31.3-11.4 43.5 0L368 92.3V80c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32v101.5l37.8 35.1c9.6 9 12.8 22.9 8 35.1S493.2 272 480 272h-16v176c0 35.3-28.7 64-64 64H112c-35.3 0-64-28.7-64-64V272H32c-13.2 0-25-8.1-29.8-20.3s-1.6-26.2 8-35.1zM216 224c-13.3 0-24 10.7-24 24v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24v-80c0-13.3-10.7-24-24-24z"/></svg>
            <div>Inicio</div>
          </li>
          <li>
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.352 20.242A4.63 4.63 0 0 0 12 22a4.63 4.63 0 0 0 3.648-1.758a27.2 27.2 0 0 1-7.296 0M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.8 25.8 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.4 4.4 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"/></svg>
            <div>Notificaciones</div>
          </li>
          <li class="footer-user-button">
            <div class="footer-user-icon-wrapper">
              <div class="footer-user-avatar">${this.userName ? this.userName[0].toUpperCase() : '?'}</div>
              <div class="status disponible"></div>
            </div>
            <div>Tú</div>
          </li>
        </ul>
      </footer>
    `
  }
}

customElements.define('chat-component', Chat)

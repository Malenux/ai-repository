class App extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.username = localStorage.getItem('chatUsername')
  }

  connectedCallback () {
    this.setupEventListeners()
    this.render()

    if (this.username) {
      setTimeout(() => {
        this.showChat()
      }, 0)
    }
  }

  setupEventListeners () {
    window.addEventListener('login-success', (event) => {
      console.log('Login exitoso recibido en app:', event.detail)
      this.username = event.detail.username
      this.showChat()
    })
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 100vh;
        }

        .app-container {
          width: 100%;
          height: 100%;
        }

        login-component,
        chat-component {
          display: block;
          width: 100%;
          height: 100%;
        }

        .hidden {
          display: none !important;
        }
      </style>

      <div class="app-container">
        <login-component id="login" class="${this.username ? 'hidden' : ''}"></login-component>
        <chat-component id="chat" class="${this.username ? '' : 'hidden'}"></chat-component>
      </div>
    `
  }

  showChat () {
    const loginComponent = this.shadow.getElementById('login')
    const chatComponent = this.shadow.getElementById('chat')

    if (loginComponent) loginComponent.classList.add('hidden')
    if (chatComponent) chatComponent.classList.remove('hidden')
  }
}

customElements.define('app-component', App)

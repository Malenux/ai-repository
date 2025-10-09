// despues le modificas tu el front
class Login extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.elements = {}
  }

  connectedCallback () {
    const user = localStorage.getItem('chatUsername')
    if (user) return

    this.render()
    this.setupElements()
    this.attachEventListeners()
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .login-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom right,rgb(7, 7, 7), #16213e);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 50px 35px;
          max-width: 420px;
          width: 90%;
          animation: fadeInUp 0.5s ease;
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-header {
          text-align: center;
          margin-bottom: 35px;
        }

        .login-header h1 {
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-group label {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input {
          padding: 16px 20px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.3s ease, transform 0.2s ease;
          font-family: inherit;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .form-group input:focus {
          border-color: #3b82f6;
          transform: scale(1.02);
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .login-button {
          background: linear-gradient(to right, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
          font-family: inherit;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
        }

        .login-button:active {
          transform: scale(0.98);
        }

        .login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          color: #ff6b6b;
          font-size: 12px;
          display: none;
          margin-top: -5px;
          font-weight: 500;
        }

        .error-message.visible {
          display: block;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 40px 25px;
          }

          .login-header h1 {
            font-size: 26px;
          }
        }
      </style>

      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h1>Bienvenido</h1>
            <p>Introduce tu nombre de usuario</p>
          </div>

          <form class="login-form">
            <div class="form-group">
              <label for="username">Usuario</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="Tu nombre aquí..." 
                required
                autocomplete="off"
                minlength="2"
                maxlength="30"
              >
              <span class="error-message">El nombre debe tener entre 2 y 30 caracteres</span>
            </div>

            <button type="submit" class="login-button">
              Acceder
            </button>
          </form>
        </div>
      </div>
    `
  }

  setupElements () {
    this.elements.form = this.shadow.querySelector('.login-form')
    this.elements.usernameInput = this.shadow.querySelector('#username')
    this.elements.error = this.shadow.querySelector('.error-message')
    this.elements.submitBtn = this.shadow.querySelector('.login-button')
  }

  attachEventListeners () {
    this.elements.usernameInput.focus()

    this.elements.form.addEventListener('submit', this.handleSubmit.bind(this))
    this.elements.usernameInput.addEventListener('input', this.handleInput.bind(this))
  }

  handleSubmit (event) {
    event.preventDefault()

    const username = this.elements.usernameInput.value.trim()
    const isValid = this.validateUsername(username)

    if (!isValid) {
      this.showError()
      return
    }

    this.hideError()
    this.disableButton()
    this.saveUsername(username)

    setTimeout(() => {
      this.emitLoginEvent(username)
    }, 300)
  }

  handleInput () {
    this.hideError()
  }

  validateUsername (username) {
    return username.length >= 2 && username.length <= 30
  }

  showError () {
    this.elements.error.classList.add('visible')
    this.elements.usernameInput.focus()
  }

  hideError () {
    this.elements.error.classList.remove('visible')
  }

  disableButton () {
    this.elements.submitBtn.disabled = true
    this.elements.submitBtn.textContent = 'Accediendo...'
  }

  saveUsername (username) {
    localStorage.setItem('chatUsername', username)
  }

  emitLoginEvent (username) {
    const eventData = {
      detail: { username },
      bubbles: true,
      composed: true
    }

    window.dispatchEvent(new CustomEvent('login-success', eventData))
    this.dispatchEvent(new CustomEvent('login-success', eventData))
    this.style.display = 'none'
  }
}

customElements.define('login-component', Login)

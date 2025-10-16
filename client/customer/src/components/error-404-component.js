class Error404 extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback () {
    this.render()
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .error-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom right, rgb(7, 7, 7), #16213e);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: white;
          z-index: 9999;
        }

        .error-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 60px 40px;
          text-align: center;
          animation: fadeInUp 0.5s ease;
          max-width: 400px;
          width: 90%;
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

        .error-header h1 {
          font-size: 80px;
          font-weight: 800;
          margin-bottom: 10px;
          background: linear-gradient(to right, #3b82f6, #2563eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .error-header p {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
        }

        .error-body p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
          margin-bottom: 35px;
        }

        .home-button {
          background: linear-gradient(to right, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .home-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
        }

        .home-button:active {
          transform: scale(0.98);
        }

        @media (max-width: 480px) {
          .error-card {
            padding: 40px 25px;
          }

          .error-header h1 {
            font-size: 60px;
          }

          .error-header p {
            font-size: 18px;
          }
        }
      </style>

      <div class="error-container">
        <div class="error-card">
          <div class="error-header">
            <h1>404</h1>
            <p>Página no encontrada</p>
          </div>
          <div class="error-body">
            <p>La página que buscas no existe o ha sido movida.</p>
            <button class="home-button">Volver al inicio</button>
          </div>
        </div>
      </div>

    `

    this.shadow.querySelector('button.home-button').addEventListener('click', (event) => {
      event.preventDefault()
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  }
}

customElements.define('error-404-component', Error404)

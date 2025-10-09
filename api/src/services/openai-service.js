const OpenAI = require('openai')

class OpenAIService {
  constructor () {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.assistantEndpoint = null
    this.threadId = null
    this.messages = null
    this.answer = null
  }

  async getAssistants () {
    const myAssistants = await this.openai.beta.assistants.list({
      order: 'desc',
      limit: '20'
    })

    return myAssistants.data
  }

  async setAssistant (assistantEndpoint) {
    this.assistantEndpoint = assistantEndpoint
  }

  async createThread () {
    try {
      const thread = await this.openai.beta.threads.create()
      this.threadId = thread.id
    } catch (error) {
      console.log(error)
    }
  }

  setThread (threadId) {
    this.threadId = threadId
  }

  async createMessage (prompt) {
    try {
      await this.openai.beta.threads.messages.create(
        this.threadId,
        {
          role: 'user',
          content: prompt
        }
      )

      this.run = await this.openai.beta.threads.runs.createAndPoll(
        this.threadId,
        {
          assistant_id: this.assistantEndpoint
        }
      )
    } catch (error) {
      console.log(error)
    }
  }

  async runStatus () {
    try {
      console.log(this.run.status)

      if (this.run.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(this.run.thread_id)
        this.messages = messages.data
        this.answer = this.messages[0].content[0].text.value
        return
      }

      if (
        this.run.required_action &&
        this.run.required_action.submit_tool_outputs &&
        this.run.required_action.submit_tool_outputs.tool_calls
      ) {
        this.tools = this.run.required_action.submit_tool_outputs.tool_calls
        return
      }

      if (this.run.status === 'queued' || this.run.status === 'in_progress') {
        await this.sleep(2000)

        this.run = await this.openai.beta.threads.runs.retrieve(
          this.run.id,
          {
            thread_id: this.threadId
          }
        )

        await this.runStatus()
      }
    } catch (error) {
      console.log(error)
    }
  }

  async submitToolOutputs (toolOutputs) {
    try {
      this.run = await this.openai.beta.threads.runs.submitToolOutputs(
        this.run.id,
        {
          thread_id: this.threadId,
          tool_outputs: toolOutputs
        }
      )

      await this.runStatus()
    } catch (error) {
      console.log(error)
    }
  }

  async runPrompt (id, variables) {
    const response = await this.openai.responses.create({
      prompt: {
        id,
        variables
      }
    })

    return response
  }

  sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

module.exports = OpenAIService

import { ref } from 'vue'

export interface WSMessage {
  type: 'text_input' | 'audio_input' | 'ai_response' | 'system_status'
  payload: {
    text?: string
    audio_encoded_base64?: string
    session_id: string

    // 接收部分
    audio?: {
      audio_data: string
      audio_format?: string
    }
  }
}

export class WebSocketService {
  private socket: WebSocket | null = null
  private _url: string
  private _sessionId: string
  private _autoReconnect: boolean
  private _reconnectInterval: number
  
  public isConnected = ref(false)
  public onMessage: ((message: WSMessage) => void) | null = null
  
  constructor(url: string, sessionId: string, autoReconnect = true, reconnectInterval = 3000) {
    this._url = url
    this._sessionId = sessionId
    this._autoReconnect = autoReconnect
    this._reconnectInterval = reconnectInterval
  }
  
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return
    
    this.socket = new WebSocket(this._url)
    
    this.socket.onopen = () => {
      console.log('WebSocket连接已建立')
      this.isConnected.value = true
    }
    
    this.socket.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data)
        if (this.onMessage) {
          this.onMessage(data)
        }
      } catch (error) {
        console.error('解析WebSocket消息时出错:', error)
      }
    }
    
    this.socket.onclose = () => {
      console.log('WebSocket连接已关闭')
      this.isConnected.value = false
      
      if (this._autoReconnect) {
        setTimeout(() => {
          if (!this.isConnected.value) {
            console.log('尝试重新连接WebSocket...')
            this.connect()
          }
        }, this._reconnectInterval)
      }
    }
    
    this.socket.onerror = (error) => {
      console.error('WebSocket错误:', error)
      this.isConnected.value = false
    }
  }
  
  send(type: 'text_input' | 'audio_input', payload: { text?: string; audio_encoded_base64?: string }): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }
    
    const message: WSMessage = { 
      type, 
      payload: { ...payload, session_id: this._sessionId } 
    }
    
    this.socket.send(JSON.stringify(message))
    return true
  }
  
  disconnect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.socket.close()
    }
  }
}

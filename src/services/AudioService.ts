import { ref } from 'vue'

export class AudioService {
  private _audioPlayer: HTMLAudioElement | null = null
  
  public isPlaying = ref(false)
  public onPlay: (() => void) | null = null
  public onEnded: (() => void) | null = null
  
  constructor() {
    this._audioPlayer = null
  }
  
  playAudio(audioBase64: string, audio_format: string='wav'): void {
    if (this.isPlaying.value) {
      // 如果有正在播放的音频，先停止
      this.stopAudio()
    }
    
    try {
      if (!this._audioPlayer) {
        this._audioPlayer = new Audio()
      }
      
      this._audioPlayer.src = `data:audio/${audio_format};base64,${audioBase64}`
      
      this._audioPlayer.onplay = () => {
        this.isPlaying.value = true
        if (this.onPlay) {
          this.onPlay()
        }
      }
      
      this._audioPlayer.onended = () => {
        this.isPlaying.value = false
        if (this.onEnded) {
          this.onEnded()
        }
      }
      
      this._audioPlayer.play().catch(error => {
        console.error('播放音频失败:', error)
        this.isPlaying.value = false
      })
    } catch (error) {
      console.error('创建音频播放器时出错:', error)
      this.isPlaying.value = false
    }
  }
  
  stopAudio(): void {
    if (this._audioPlayer) {
      this._audioPlayer.pause()
      this._audioPlayer.currentTime = 0
      this.isPlaying.value = false
    }
  }
  
  destroy(): void {
    this.stopAudio()
    this._audioPlayer = null
  }
}

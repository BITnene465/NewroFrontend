import { ref } from 'vue'

export class AudioService {
  private _audioPlayer: HTMLAudioElement | null = null
  private _audioContext: AudioContext | null = null
  private _analyser: AnalyserNode | null = null
  private _animationFrameId: number | null = null
  private _sourceNode: MediaElementAudioSourceNode | null = null
  
  public isPlaying = ref(false)
  public onPlay: (() => void) | null = null
  public onEnded: (() => void) | null = null
  
  constructor() {
    this._audioPlayer = null
  }
  
  playAudio(audioBase64: string, audio_format: string='wav', live2DModel?: any): void {
    if (this.isPlaying.value) {
      // 如果有正在播放的音频，先停止
      this.stopAudio()
    }
    
    try {
      this._audioPlayer = new Audio()
      
      this._audioPlayer.src = `data:audio/${audio_format};base64,${audioBase64}`
      
      this._audioPlayer.onplay = () => {
        this.isPlaying.value = true
        if (this.onPlay) {
          this.onPlay()
          this._setupMouthTracking(live2DModel)
        }
      }
      
      this._audioPlayer.onended = () => {
        this.isPlaying.value = false
        if (this.onEnded) {
          this.onEnded()
          this._stopMouthTracking()
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

  private _setupMouthTracking(live2DModel?: any) {
    if (!this._audioPlayer) return

    if (this._audioContext?.state === 'closed') {
      this._audioContext = null
    }

    if (!this._audioContext) {
      this._audioContext = new AudioContext()
    }

    // 创建 source node
    this._sourceNode = this._audioContext.createMediaElementSource(this._audioPlayer)

    // 创建 analyser node
    this._analyser = this._audioContext.createAnalyser()
    this._analyser.fftSize = 512

    this._sourceNode.connect(this._analyser)
    this._analyser.connect(this._audioContext.destination)

    const dataArray = new Uint8Array(this._analyser.frequencyBinCount)

    const updateMouth = () => {
      if (!this.isPlaying.value) return

      this._analyser!.getByteFrequencyData(dataArray)
      const avg = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 50
      const mouthValue = Math.min(1, avg / 128)

      if (live2DModel) {
        console.log("正在控制口型哦")
        live2DModel.internalModel.coreModel.setParameterValueById("ParamA", mouthValue)
      }

      this._animationFrameId = requestAnimationFrame(updateMouth)
    }

    updateMouth()
  }

  private _stopMouthTracking() {
    if (this._sourceNode) {
      this._sourceNode.disconnect()
      this._sourceNode = null
    }
    
    if (this._analyser) {
      this._analyser.disconnect()
      this._analyser = null
    }

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId)
      this._animationFrameId = null
    }

    if (this._audioContext) {
      this._audioContext.close().catch(console.warn)
      this._audioContext = null
    }

    this._sourceNode = null
    this._analyser = null
  }
  
  stopAudio(): void {
    if (this._audioPlayer) {
      this._audioPlayer.pause()
      this._audioPlayer.currentTime = 0
      // 移除事件监听防止内存泄漏
      this._audioPlayer.onplay = null
      this._audioPlayer.onended = null
      this._audioPlayer = null  // 重点：解除引用
    }
    this.isPlaying.value = false
  }
  
  destroy(): void {
    this.stopAudio()
    this._audioPlayer = null
  }
}

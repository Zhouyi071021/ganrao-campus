<template>
  <router-view />
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// ========== 全局音乐播放器 ==========
const musicPlaying = ref(false)
const audio = ref(null)
const currentTrackIndex = ref(0)
const musicTracks = ['/music/bgm1.mp3', '/music/bgm2.mp3', '/music/bgm3.mp3','/music/bgm4.mp3','/music/bgm5.mp3']

const toggleMusic = () => {
  if (!audio.value) {
    // 首次播放：随机选歌
    const randomIndex = Math.floor(Math.random() * musicTracks.length)
    currentTrackIndex.value = randomIndex
    audio.value = new Audio(musicTracks[randomIndex])
    audio.value.loop = false
    audio.value.onended = () => {
      // 自然播放结束：自动随机切歌
      let nextIndex = Math.floor(Math.random() * musicTracks.length)
      while (nextIndex === currentTrackIndex.value && musicTracks.length > 1) {
        nextIndex = Math.floor(Math.random() * musicTracks.length)
      }
      currentTrackIndex.value = nextIndex
      audio.value.src = musicTracks[nextIndex]
      audio.value.play()
    }
    audio.value.play()
    musicPlaying.value = true
    return
  }

  if (musicPlaying.value) {
    // 正在播放 → 暂停
    audio.value.pause()
    musicPlaying.value = false
  } else {
    // 暂停状态 → 随机换歌并播放
    let randomIndex = Math.floor(Math.random() * musicTracks.length)
    while (randomIndex === currentTrackIndex.value && musicTracks.length > 1) {
      randomIndex = Math.floor(Math.random() * musicTracks.length)
    }
    currentTrackIndex.value = randomIndex
    audio.value.src = musicTracks[randomIndex]
    audio.value.play()
    musicPlaying.value = true
  }
}

// 挂载到全局，供其他组件使用
window.$music = {
  musicPlaying,
  toggleMusic
}

// 组件卸载时释放音频资源（可选）
onUnmounted(() => {
  if (audio.value) {
    audio.value.pause()
    audio.value = null
  }
})
</script>
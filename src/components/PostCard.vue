<template>
  <div class="post-card" :data-post-id="post.id" @click="$emit('click')">
    <div class="card-header">
      <div class="user-info">
        <div class="avatar-placeholder">
          <span class="avatar-emoji">{{ avatarEmoji }}</span>
        </div>
        <div class="user-detail">
          <span class="user-name">{{ post.anonymousName }}</span>
          <div class="user-meta">
            <span class="user-school">{{ post.school || '🌍 赣饶·广丰' }}</span>
            <span class="post-number">#{{ postNumber }}</span>
          </div>
        </div>
      </div>
      <span class="post-time">{{ formatSmartTime(post.createdAt) }}</span>
    </div>

    <div class="post-content">{{ post.content }}</div>

    <div v-if="post.images?.length" class="image-grid">
      <div v-for="(img, i) in post.images.slice(0, 3)" :key="i" class="image-item">
        <img :src="img" alt="图片" />
        <div v-if="i === 2 && post.images.length > 3" class="image-overlay">
          +{{ post.images.length - 3 }}
        </div>
      </div>
    </div>

    <div v-if="post.video" class="video-wrapper" @click.stop>
      <video :src="post.video.url" :poster="post.video.thumbnail" controls preload="metadata" />
      <div class="video-badge">
        <van-icon name="video-o" size="12" />
        <span>{{ formatDuration(post.video.duration) }}</span>
      </div>
    </div>

    <div v-if="showActions" class="card-actions">
      <div class="action-btn" @click.stop="handleLike">
        <van-icon
          :name="isLiked ? 'like' : 'like-o'"
          :color="isLiked ? '#E74C3C' : '#7E9BB5'"
          size="18"
        />
        <span class="action-text" :class="{ 'liked-text': isLiked }">{{ post.likes || 0 }}</span>
      </div>
      <div class="action-btn" @click.stop="$emit('click')">
        <van-icon name="comment-o" color="#7E9BB5" size="18" />
        <span class="action-text">{{ post.commentCount || 0 }}</span>
      </div>
      <div class="action-btn" @click.stop="handleShare">
        <van-icon name="share-o" color="#7E9BB5" size="18" />
      </div>
    </div>

    <div class="brand-watermark">#赣饶广丰校圈</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { supabase } from '../config/supabase.js'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  post: Object,
  showActions: { type: Boolean, default: true }
})

const emit = defineEmits(['like', 'click', 'share'])

const isLiked = ref(false)

const getUserToken = () => {
  let token = localStorage.getItem('ganrao_token')
  if (!token) {
    token = uuidv4()
    localStorage.setItem('ganrao_token', token)
  }
  return token
}

const checkLiked = async () => {
  if (!props.post.id) return
  const token = getUserToken()
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', props.post.id)
    .eq('user_token', token)
    .maybeSingle()
  isLiked.value = !!data
}

// 修正编号：优先使用 post_number，若无则用 ID 后四位
const postNumber = computed(() => {
  if (props.post.post_number) return props.post.post_number
  return props.post.id?.toString().slice(-4) || '?'
})

// 头像 emoji（与详情页完全一致的哈希算法）
const avatarEmoji = computed(() => {
  const name = props.post.anonymousName || ''
  const emojis = ['🐼', '🐧', '🦊', '🐨', '🐸', '🐙', '🦁', '🐮', '🐷', '🐭']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return emojis[Math.abs(hash) % emojis.length]
})

const formatSmartTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const handleLike = () => {
  if (isLiked.value) {
    showToast('已经点过赞啦')
    return
  }
  isLiked.value = true
  emit('like', props.post.id)
}

const handleShare = () => {
  const postUrl = `${window.location.origin}/post/${props.post.id}`
  const shareText = `【赣饶·广丰校圈】${props.post.anonymousName}：${props.post.content.slice(0, 50)}... 点击查看：${postUrl}`
  
  if (navigator.share) {
    navigator.share({
      title: '赣饶·广丰校圈',
      text: shareText,
      url: postUrl,
    }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(shareText).then(() => {
      showToast('链接已复制，快去分享吧！')
    }).catch(() => {
      showToast('分享失败，请手动复制链接')
    })
  }
  emit('share', props.post)
}

onMounted(() => {
  checkLiked()
})
</script>

<style scoped>
/* 保持原有样式不变，已在您提供的代码中完整包含 */
.post-card {
  background: #ffffff;
  margin: 10px 14px;
  padding: 14px 14px 12px;
  border-radius: 22px;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.04);
  border: 1px solid rgba(74, 144, 226, 0.06);
  position: relative;
  transition: all 0.15s;
  width: calc(100% - 28px);
  max-width: 100%;
  box-sizing: border-box;
}
.post-card:active {
  transform: scale(0.99);
  background: #fbfdff;
}
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar-placeholder {
  width: 34px;
  height: 34px;
  background: linear-gradient(145deg, #e8f2ff, #d4e6ff);
  border-radius: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(74, 144, 226, 0.15);
  flex-shrink: 0;
}
.avatar-emoji {
  font-size: 18px;
  line-height: 1;
}
.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-name {
  font-weight: 650;
  font-size: 14px;
  color: #1e2b3c;
  line-height: 1.2;
}
.user-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-school {
  font-size: 11px;
  color: #4A90E2;
  background: rgba(74, 144, 226, 0.06);
  padding: 2px 6px;
  border-radius: 14px;
  font-weight: 500;
}
.post-number {
  font-size: 10px;
  color: #9bb5d4;
  font-weight: 500;
}
.post-time {
  font-size: 11px;
  color: #a0bbd0;
  white-space: nowrap;
}
.post-content {
  font-size: 14px;
  line-height: 1.5;
  color: #2a3b4c;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.image-grid {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.image-item {
  position: relative;
  width: 75px;
  height: 75px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.08);
  flex-shrink: 0;
}
.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}
.video-wrapper {
  position: relative;
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.08);
  height: 140px;
}
.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}
.video-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(2px);
  color: white;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(74, 144, 226, 0.08);
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 20px;
  transition: background 0.15s;
}
.action-btn:active {
  background: rgba(74, 144, 226, 0.05);
}
.action-text {
  font-size: 13px;
  font-weight: 500;
  color: #7E9BB5;
}
.liked-text {
  color: #E74C3C !important;
}
.brand-watermark {
  position: absolute;
  bottom: 6px;
  right: 12px;
  font-size: 9px;
  font-weight: 600;
  color: rgba(74, 144, 226, 0.2);
  letter-spacing: 0.5px;
  pointer-events: none;
}
</style>
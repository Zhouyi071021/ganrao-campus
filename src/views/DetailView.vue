<template>
  <div class="detail-page">
    <!-- 顶部导航 -->
    <header class="detail-header">
      <van-icon name="arrow-left" size="24" @click="$router.back()" />
      <span class="header-title">帖子详情</span>
      <van-icon name="share-o" size="22" color="#4A90E2" @click="handleShare" />
    </header>

    <div v-if="!post.id" class="loading-state">
      <van-loading size="40" color="#4A90E2" />
    </div>

    <!-- 帖子卡片 -->
    <div v-else class="post-card">
      <div class="card-header">
        <div class="user-info">
          <span class="avatar">{{ avatarEmoji }}</span>
          <div class="user-text">
            <div class="name-row">
              <span class="name">{{ post.anonymousName }}</span>
              <span class="post-num">#{{ postNumber }}</span>
            </div>
            <div class="meta-row">
              <span class="school">{{ post.school || '🌍 赣饶·广丰' }}</span>
              <span class="warm-tip">{{ warmSentence }}</span>
            </div>
          </div>
        </div>
        <span class="time">{{ formatTime(post.createdAt) }}</span>
      </div>

      <div class="content">{{ post.content }}</div>

      <div class="images" v-if="post.images?.length">
        <img v-for="(img, i) in post.images" :key="i" :src="img" @click="previewImage(i)" />
      </div>

      <div class="video" v-if="post.video">
        <video :src="post.video.url" controls :poster="post.video.thumbnail" />
      </div>

      <div class="actions">
        <div class="action" @click="handleLike">
          <van-icon :name="isLiked ? 'like' : 'like-o'" :color="isLiked ? '#E74C3C' : '#7E9BB5'" size="20" />
          <span>{{ post.likes || 0 }}</span>
        </div>
        <div class="action" @click="focusComment">
          <van-icon name="comment-o" color="#7E9BB5" size="20" />
          <span>{{ post.commentCount || 0 }}</span>
        </div>
        <div class="action" @click="handleShare">
          <van-icon name="share-o" color="#7E9BB5" size="20" />
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="comment-section">
      <div class="comment-title">评论 {{ comments.length }}</div>
      <div v-if="comments.length === 0" class="empty">暂无评论，快来抢沙发～</div>
      <div v-else class="comment-list">
        <div v-for="c in comments" :key="c.id" class="comment-item">
          <span class="comment-avatar">{{ getEmoji(c.anonymousName) }}</span>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">{{ c.anonymousName }}</span>
              <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
            </div>
            <div class="comment-text">{{ c.content }}</div>
            <div class="comment-images" v-if="c.images?.length">
              <img v-for="(img, i) in c.images" :key="i" :src="img" @click="previewCommentImage(c.images, i)" />
            </div>
          </div>
        </div>
      </div>
      <div class="comment-brand">
        <span>—— 赣饶·广丰校圈 · 树洞 ——</span>
      </div>
    </div>

    <!-- 底部输入栏（未评论时） -->
    <div class="input-bar" v-if="!hasCommented">
      <div class="input-row">
        <van-field
          ref="commentInput"
          v-model="commentText"
          type="textarea"
          placeholder="写评论..."
          maxlength="200"
          rows="1"
          autosize
          border
          class="comment-field"
        />
        <div class="attach-btn" @click="$refs.fileInput.click()">
          <van-icon name="photo-o" size="22" />
        </div>
        <button class="send-btn" :disabled="!commentText.trim() || submitting" @click="submitComment">发送</button>
      </div>
      <!-- 图片预览区（独立成行，不撑大输入框） -->
      <div v-if="commentImages.length" class="selected-images">
        <div v-for="(img, i) in commentImages" :key="i" class="selected-image-item">
          <img :src="img.content" />
          <van-icon name="cross" class="remove-img" @click="removeCommentImage(i)" />
        </div>
      </div>
      <input ref="fileInput" type="file" accept="image/*" multiple style="display: none" @change="onFileChange" />
    </div>

    <!-- 已评论状态 -->
    <div v-else class="commented-bar">
      <div class="commented-text">
        <van-icon name="success" size="18" color="#4A90E2" />
        <span>心事说给树洞，去频道遇见温暖的人</span>
      </div>
      <div class="channel-link" @click="openChannel">
        <span>赣饶·广丰校圈</span>
        <van-icon name="arrow" size="16" />
      </div>
    </div>

    <!-- 图片预览 -->
    <van-image-preview v-model:show="showPreview" :images="previewImages" :start-position="previewIndex" />
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { supabase } from '../config/supabase.js'
import { channelConfig } from '../config/channel.js'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const router = useRouter()
const postId = route.params.id

const post = ref({})
const comments = ref([])
const commentText = ref('')
const commentImages = ref([])
const hasCommented = ref(false)
const isLiked = ref(false)
const userToken = ref('')
const showPreview = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)
const commentInput = ref(null)
const submitting = ref(false)   // 防止重复提交

const warmSentences = ['💭 树洞在听', '✨ 你并不孤单', '🌿 风会记得', '🌟 勇敢说出来', '🫂 有人懂你']
const warmSentence = ref(warmSentences[0])

const getUserToken = () => {
  let token = localStorage.getItem('ganrao_token')
  if (!token) {
    token = uuidv4()
    localStorage.setItem('ganrao_token', token)
  }
  return token
}

const postNumber = computed(() => {
  if (post.value.post_number) return post.value.post_number
  return post.value.id?.toString().slice(-4) || '?'
})

const avatarEmoji = computed(() => {
  const name = post.value.anonymousName || ''
  const emojis = ['🐼', '🐧', '🦊', '🐨', '🐸', '🐙', '🦁', '🐮', '🐷', '🐭']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return emojis[Math.abs(hash) % emojis.length]
})

const getEmoji = (name) => {
  const emojis = ['🐶', '🐱', '🐼', '🐧', '🦊', '🐨', '🐸', '🐙']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return emojis[Math.abs(hash) % emojis.length]
}

const formatTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const diff = Date.now() - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const loadPost = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()
    if (error) throw error
    if (!data) throw new Error('帖子不存在')
    post.value = {
      id: data.id,
      post_number: data.post_number,
      content: data.content,
      category: data.category,
      school: data.school,
      anonymousName: data.anonymous_name,
      images: data.images || [],
      video: data.video,
      likes: data.likes || 0,
      commentCount: data.comment_count || 0,
      createdAt: data.created_at,
    }
    previewImages.value = post.value.images
    warmSentence.value = warmSentences[Math.floor(Math.random() * warmSentences.length)]
  } catch (err) {
    console.error('加载帖子失败:', err)
    showToast('帖子不存在或已被删除')
    router.back()
  }
}

const checkLiked = async () => {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_token', userToken.value)
    .maybeSingle()
  isLiked.value = !!data
}

const loadComments = async () => {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
  comments.value = data.map(c => ({
    id: c.id,
    content: c.content,
    anonymousName: c.anonymous_name,
    images: c.images || [],
    createdAt: c.created_at,
    userToken: c.user_token,
  }))
  hasCommented.value = comments.value.some(c => c.userToken === userToken.value)
}

const handleLike = async () => {
  if (isLiked.value) return showToast('已经点过赞啦')
  await supabase.from('likes').insert({ post_id: postId, user_token: userToken.value })
  await supabase.rpc('increment_likes', { post_id: postId })
  isLiked.value = true
  post.value.likes++
}

const handleShare = () => {
  const url = `${window.location.origin}/post/${postId}`
  const text = `【赣饶·广丰校圈】${post.value.anonymousName}：${post.value.content.slice(0, 40)}... ${url}`
  if (navigator.share) {
    navigator.share({ title: '赣饶·广丰校圈', text, url }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('链接已复制'))
  }
}

const focusComment = () => commentInput.value?.focus()

// 优化图片读取：使用 Promise 批量处理
const readFileAsDataURL = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve({ content: e.target.result })
    reader.readAsDataURL(file)
  })
}

const onFileChange = async (e) => {
  const files = Array.from(e.target.files)
  if (commentImages.value.length + files.length > 3) {
    showToast('最多只能上传3张图片')
    e.target.value = ''
    return
  }
  
  const newImages = await Promise.all(files.map(file => readFileAsDataURL(file)))
  commentImages.value.push(...newImages)
  e.target.value = ''
}

const submitComment = async () => {
  if (!commentText.value.trim()) return
  if (submitting.value) return   // 防止重复点击
  submitting.value = true

  const nouns = ['枫叶', '月光', '星辰', '海风', '青柠', '薄荷', '橘子', '梧桐', '星河', '晚风', '晨曦', '细雨']
  const anonymousName = `匿名${nouns[Math.floor(Math.random() * nouns.length)]}`
  const images = commentImages.value.map(img => img.content)

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content: commentText.value,
    anonymous_name: anonymousName,
    user_token: userToken.value,
    images,
  })

  if (error) {
    showToast('评论失败，请重试')
    submitting.value = false
    return
  }

  await supabase.rpc('increment_comment_count', { post_id: postId })
  post.value.commentCount++
  showToast('评论成功')
  
  // 清空输入
  commentText.value = ''
  commentImages.value = []
  submitting.value = false
  loadComments()
}

const removeCommentImage = (index) => {
  commentImages.value.splice(index, 1)
}

const previewImage = (index) => {
  previewImages.value = post.value.images
  previewIndex.value = index
  showPreview.value = true
}

const previewCommentImage = (images, index) => {
  previewImages.value = images
  previewIndex.value = index
  showPreview.value = true
}

const openChannel = () => window.open(channelConfig.url, '_blank')

onMounted(() => {
  userToken.value = getUserToken()
  loadPost()
  checkLiked()
  loadComments()
})
</script>
<style scoped>
.detail-page {
  min-height: 100vh;
  background: #F4F9FF;
  padding-bottom: 70px;
}
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
}
.loading-state {
  text-align: center;
  padding: 50px;
}
.post-card {
  background: white;
  margin: 12px 16px;
  padding: 16px;
  border-radius: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.user-info {
  display: flex;
  gap: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  background: #e8f2ff;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.user-text {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name {
  font-weight: 600;
}
.post-num {
  font-size: 12px;
  color: #999;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.school {
  font-size: 12px;
  color: #4A90E2;
  background: #e8f2ff;
  padding: 2px 8px;
  border-radius: 12px;
}
.warm-tip {
  font-size: 12px;
  color: #7E9BB5;
  background: #F0F7FF;
  padding: 2px 8px;
  border-radius: 12px;
}
.time {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
}
.content {
  margin-bottom: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.images {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.images img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
}
.video video {
  width: 100%;
  max-height: 250px;
  border-radius: 12px;
}
.actions {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.action {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #7E9BB5;
  cursor: pointer;
}
.comment-section {
  background: white;
  margin: 12px 16px;
  padding: 16px;
  border-radius: 20px;
}
.comment-title {
  font-weight: 600;
  margin-bottom: 12px;
}
.empty {
  color: #aaa;
  text-align: center;
  padding: 20px;
}
.comment-item {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.comment-avatar {
  width: 32px;
  height: 32px;
  background: #e8f2ff;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.comment-body {
  flex: 1;
  min-width: 0; /* 防止 flex 溢出 */
}
.comment-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.comment-author {
  font-weight: 600;
  color: #1e2b3c;
}
.comment-time {
  font-size: 11px;
  color: #aaa;
}
.comment-text {
  color: #2a3b4c;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.comment-images {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.comment-images img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
.comment-brand {
  text-align: center;
  color: #A0BBD0;
  font-size: 12px;
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px dashed rgba(74, 144, 226, 0.2);
}
.input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-top: 1px solid #eee;
  padding: 10px 16px;
}
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.comment-field {
  flex: 1;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
}
.comment-field :deep(.van-field__control) {
  max-height: 80px;
  overflow-y: auto;
}
.attach-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 44px;
  cursor: pointer;
}
.send-btn {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.send-btn:disabled {
  background: #ccc;
}
.selected-images {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.selected-image-item {
  position: relative;
  width: 60px;
  height: 60px;
}
.selected-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}
.remove-img {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #4A90E2;
  color: white;
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.commented-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0 auto;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.commented-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4A90E2;
  font-weight: 500;
}
.channel-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #F0F7FF;
  padding: 6px 14px;
  border-radius: 30px;
  color: #4A90E2;
  font-weight: 600;
  cursor: pointer;
}
</style>
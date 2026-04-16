<template>
  <div class="admin-page">
    <header class="admin-header">
      <van-icon name="arrow-left" size="24" @click="$router.push('/')" />
      <span class="title">管理后台</span>
      <span style="width: 24px"></span>
    </header>

    <!-- 登录界面 -->
    <div v-if="!authorized" class="login-box">
      <div class="login-card">
        <van-icon name="shield-o" size="48" color="#4A90E2" />
        <h3>管理员登录</h3>
        <van-field
          v-model="password"
          type="password"
          placeholder="请输入管理密码"
          @keyup.enter="login"
        />
        <van-button type="primary" block round @click="login" style="margin-top: 24px">
          进入后台
        </van-button>
      </div>
    </div>

    <!-- 管理主界面 -->
    <div v-else class="admin-main">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ pendingCount }}</span>
          <span class="stat-label">待审核</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ todayCount }}</span>
          <span class="stat-label">今日新增</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalPosts }}</span>
          <span class="stat-label">总帖子</span>
        </div>
      </div>

      <!-- 工作指南 -->
      <div class="guide-card">
        <div class="guide-header">
          <van-icon name="info-o" size="18" color="#4A90E2" />
          <span>审核工作指南 · 赣饶·广丰校圈</span>
        </div>
        <p class="guide-text">
          欢迎来到管理后台。请仔细审核每条帖子，确认无违规后点击「通过」标记为已阅。
          已通过帖子将移至列表底部。若发现违规内容，可直接删除（评论同步删除）。
        </p>
      </div>

      <!-- 帖子列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="—— 没有更多帖子了 ——"
          :immediate-check="false"
          @load="loadPosts"
        >
          <div
            v-for="post in posts"
            :key="post.id"
            class="post-item"
            :class="{ approved: post.status === 'approved' }"
          >
            <div class="post-header">
              <div class="post-info">
                <span class="post-anonymous">{{ post.anonymous_name }}</span>
                <span class="post-school">{{ post.school || '全区' }}</span>
                <span class="post-number">#{{ post.post_number || String(post.id).slice(-4) }}</span>
                <span v-if="post.status === 'approved'" class="status-badge approved">
                  <van-icon name="success" size="12" />
                  已通过
                </span>
                <span v-else class="status-badge pending">
                  <van-icon name="clock-o" size="12" />
                  待审核
                </span>
              </div>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>

            <div class="post-content">{{ post.content }}</div>

            <div v-if="post.images?.length" class="post-images">
              <img v-for="(img, i) in post.images" :key="i" :src="img" />
            </div>
            <div v-if="post.video" class="post-video">
              <video :src="post.video.url" controls :poster="post.video.thumbnail" />
            </div>

            <div class="post-actions">
              <van-button
                v-if="post.status !== 'approved'"
                size="small"
                type="primary"
                round
                @click="approvePost(post)"
              >
                <van-icon name="success" />
                通过
              </van-button>
              <van-button size="small" plain type="danger" round @click="deletePost(post.id)">
                <van-icon name="delete-o" />
                删除
              </van-button>
              <van-button size="small" plain round @click="toggleComments(post.id)">
                <van-icon name="comment-o" />
                评论 ({{ post.comment_count || 0 }})
              </van-button>
            </div>

            <!-- 评论区 -->
            <div v-if="expandedPostId === post.id" class="comment-section">
              <div v-if="commentsLoading">加载中...</div>
              <div v-else-if="postComments.length === 0" class="no-comments">暂无评论</div>
              <div v-else class="comment-list">
                <div v-for="comment in postComments" :key="comment.id" class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.anonymous_name }}</span>
                    <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                  </div>
                  <div class="comment-content">{{ comment.content }}</div>
                  <div v-if="comment.images?.length" class="comment-images">
                    <img v-for="(img, i) in comment.images" :key="i" :src="img" />
                  </div>
                  <div class="comment-action">
                    <van-button size="mini" type="danger" round @click="deleteComment(comment.id, post.id)">
                      删除评论
                    </van-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 底部品牌引流条 -->
    <div class="admin-footer" @click="openChannel">
      <div class="footer-left">
        <van-icon name="cluster-o" size="18" />
        <span>前往赣饶·广丰校圈</span>
      </div>
      <van-icon name="arrow" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../config/supabase.js'
import { channelConfig } from '../config/channel.js'
import { showToast, showConfirmDialog } from 'vant'

const password = ref('')
const authorized = ref(false)
const posts = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10

const pendingCount = ref(0)
const todayCount = ref(0)
const totalPosts = ref(0)

const expandedPostId = ref(null)
const postComments = ref([])
const commentsLoading = ref(false)

const login = () => {
  if (password.value === 'ganrao123') {
    authorized.value = true
    page.value = 1
    finished.value = false
    posts.value = []
    loadStats()
    loadPosts()
  } else {
    showToast('密码错误')
  }
}

const loadStats = async () => {
  try {
    const { count: pending } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('status', 'pending')
    pendingCount.value = pending || 0

    const { count: total } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
    totalPosts.value = total || 0

    const today = new Date().toISOString().split('T')[0]
    const { count: todayCnt } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('created_at', today)
    todayCount.value = todayCnt || 0
  } catch (err) {
    console.error('统计加载失败:', err)
  }
}

const loadPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_deleted', false)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .range((page.value - 1) * pageSize, page.value * pageSize - 1)

    if (error) throw error

    if (page.value === 1) posts.value = data
    else posts.value.push(...data)

    if (!data || data.length < pageSize) finished.value = true
    page.value++
  } catch (err) {
    console.error('加载帖子失败:', err)
    showToast('加载失败')
    finished.value = true
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  loadStats()
  loadPosts()
}

const approvePost = async (post) => {
  showConfirmDialog({
    title: '确认通过',
    message: '通过后该帖子将移至列表底部，确定吗？',
  }).then(async () => {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'approved' })
      .eq('id', post.id)
    if (error) {
      showToast('操作失败')
      return
    }
    showToast('已通过审核')
    onRefresh()
  }).catch(() => {})
}

const deletePost = async (postId) => {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后该帖子及所有评论将无法恢复，确定吗？',
  }).then(async () => {
    // 软删除帖子
    const { error: e1 } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId)
    if (e1) {
      showToast('删除失败')
      return
    }
    // 软删除评论
    await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('post_id', postId)
    
    showToast('已删除')
    posts.value = posts.value.filter(p => p.id !== postId)
    if (expandedPostId.value === postId) {
      expandedPostId.value = null
      postComments.value = []
    }
    loadStats()
  }).catch(() => {})
}

const toggleComments = async (postId) => {
  if (expandedPostId.value === postId) {
    expandedPostId.value = null
    postComments.value = []
    return
  }
  expandedPostId.value = postId
  commentsLoading.value = true
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
  
  if (error) {
    showToast('加载评论失败')
  } else {
    postComments.value = data
  }
  commentsLoading.value = false
}

const deleteComment = (commentId, postId) => {
  showConfirmDialog({
    title: '确认删除评论',
    message: '确定要删除这条评论吗？',
  }).then(async () => {
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
    if (error) {
      showToast('删除失败')
      return
    }
    await supabase.rpc('decrement_comment_count', { post_id: postId })
    showToast('评论已删除')
    postComments.value = postComments.value.filter(c => c.id !== commentId)
    const post = posts.value.find(p => p.id === postId)
    if (post) post.comment_count = Math.max(0, (post.comment_count || 1) - 1)
  }).catch(() => {})
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

const openChannel = () => window.open(channelConfig.url, '_blank')
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #F4F9FF;
  padding-bottom: 60px;
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.login-box {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}
.login-card {
  background: white;
  border-radius: 28px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(74, 144, 226, 0.08);
}
.login-card h3 {
  margin: 16px 0 24px;
  color: #2C3E50;
}
.admin-main {
  padding: 16px;
}
.stats-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 16px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.04);
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #4A90E2;
  display: block;
}
.stat-label {
  font-size: 13px;
  color: #7E9BB5;
}
.guide-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.04);
}
.guide-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #2C3E50;
}
.guide-text {
  font-size: 14px;
  line-height: 1.6;
  color: #5a6c7e;
}
.post-item {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  border: 1px solid #f0f0f0;
}
.post-item.approved {
  background: #fafbfc;
  border-color: #e0f0e8;
}
.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}
.post-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.post-anonymous {
  font-weight: 600;
  color: #2C3E50;
}
.post-school {
  background: #E8F2FF;
  color: #4A90E2;
  padding: 2px 8px;
  border-radius: 14px;
  font-size: 12px;
}
.post-number {
  font-size: 12px;
  color: #999;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight:500;
}
.status-badge.pending {
  background: #FFF3E0;
  color: #E6A020;
}
.status-badge.approved {
  background: #E8F5E9;
  color: #2E7D32;
}
.post-time {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
}
.post-content {
  margin-bottom: 12px;
  line-height: 1.5;
  color: #2a3b4c;
}
.post-images {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.post-images img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 10px;
}
.post-video video {
  width: 100%;
  max-height: 200px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.post-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.comment-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #ccc;
}
.no-comments {
  color: #999;
  text-align: center;
  padding: 10px;
}
.comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.comment-author {
  font-weight: 500;
  color: #2C3E50;
}
.comment-time {
  font-size: 11px;
  color: #aaa;
}
.comment-content {
  margin-bottom: 6px;
  color: #34495E;
}
.comment-images {
  display: flex;
  gap: 6px;
  margin: 6px 0;
}
.comment-images img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
.comment-action {
  margin-top: 8px;
  text-align: right;
}
.admin-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(74, 144, 226, 0.2);
  color: #4A90E2;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
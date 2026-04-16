<template>
  <div class="home">
    <!-- ========== 导航栏 + 每日纸条 融合区域 ========== -->
    <div class="hero-section">
      <header class="brand-header">
        <div class="header-left" @click="$router.push('/admin')">
          <div class="header-avatar">
            <img v-if="channelAvatar" :src="channelAvatar" class="avatar-img" alt="频道头像" />
            <van-icon v-else name="cluster-o" size="26" color="#fff" />
          </div>
        </div>
        <div class="header-center" @click="handleBrandClick">
          <span class="brand-name">赣饶·广丰校圈</span>
          <span class="brand-sub">· 树洞</span>
        </div>
        <div class="header-right">
          <div class="live-clock">
            <span class="clock-date">{{ currentDate }}</span>
            <span class="clock-time">{{ currentTime }}</span>
          </div>
        </div>
      </header>

      <div class="quote-embedded" @click="refreshQuote">
        <div class="quote-main">
          <span class="quote-icon">🌲</span>
          <span class="quote-text">{{ currentQuote }}</span>
          <van-icon name="replay" class="quote-refresh" />
        </div>
        <div class="quote-brand">—— 赣饶·广丰校圈 · 每日陪伴 ——</div>
      </div>
    </div>

    <!-- ========== 分类导航 ========== -->
    <div class="category-wrapper">
      <div class="category-container">
        <div
          v-for="cat in categories"
          :key="cat.value"
          class="category-item"
          :class="{ active: currentCategory === cat.value }"
          @click="switchCategory(cat.value)"
        >
          <span class="cat-emoji">{{ cat.icon }}</span>
          <span class="cat-label">{{ cat.label }}</span>
        </div>
      </div>
    </div>

    <!-- ========== 筛选行 ========== -->
    <div class="filter-row">
      <div class="school-trigger" @click="showSchoolPicker = true">
        <van-icon name="location-o" size="18" />
        <span>{{ currentSchoolLabel }}</span>
        <van-icon name="arrow-down" size="14" />
      </div>
      <div class="my-posts-trigger" :class="{ active: showMyPostsOnly }" @click="toggleMyPosts">
        <van-icon name="user-o" size="18" />
        <span>我的</span>
      </div>
      <div class="sort-trigger" @click="toggleSort">
        <van-icon :name="sortBy === 'hot' ? 'fire-o' : 'clock-o'" size="18" />
        <span>{{ sortBy === 'hot' ? '最热' : '最新' }}</span>
      </div>
      <div class="random-trigger" @click="goRandomPost">
        <van-icon name="flower-o" size="18" />
        <span>随机</span>
      </div>
    </div>

    <!-- ========== 帖子列表 ========== -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="—— 🌲 已经到底啦 ——"
        @load="onLoad"
      >
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <div class="empty-illustration">🌲</div>
          <p class="empty-title">赣饶·广丰校圈 树洞空空</p>
          <p class="empty-desc">快来写下第一条心事吧</p>
          <img :src="channel.qrcode" class="empty-qrcode" @click="showQrcode = true" />
        </div>

        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @share="handleShare"
          @click="goDetail(post.id)"
        />
      </van-list>
    </van-pull-refresh>

    <!-- ========== 底部功能栏 ========== -->
    <div class="bottom-bar">
      <div class="bottom-action" @click="toggleMusic">
        <van-icon :name="musicPlaying ? 'music-o' : 'music-o'" size="22" />
        <span>音乐</span>
      </div>
      <div class="bottom-action" @click="showDonate = true">
        <van-icon name="gold-coin-o" size="22" />
        <span>赞赏</span>
      </div>
      <button class="bottom-post-btn" @click="showPostDialog = true">
        <van-icon name="add-o" size="26" />
        <span>匿名投稿</span>
      </button>
      <div class="bottom-action" @click="showIntro = true">
        <van-icon name="bullhorn-o" size="22" />
        <span>公告</span>
      </div>
      <div class="bottom-action" @click="openChannel">
        <van-icon name="cluster-o" size="22" />
        <span>频道</span>
      </div>
    </div>

    <!-- ========== 弹窗 ========== -->
    <van-popup v-model:show="showIntro" :style="{ width: '90%', padding: '24px 20px', borderRadius: '28px', maxHeight: '70vh', overflowY: 'auto' }" round>
      <div class="intro-container">
        <h3 class="intro-title">📢 赣饶·广丰校圈 · 公告</h3>
        <div class="intro-content">
          <p class="intro-welcome">👋 欢迎来到广丰中学生专属树洞！</p>
          <ul class="intro-list">
            <li>🌲 在这里，你可以匿名倾诉心事、表白、吐槽</li>
            <li>💬 每条帖子都可评论互动，但每人限一条</li>
            <li>📸 支持图片、短视频投稿，分享你的校园生活</li>
            <li>🔒 所有内容经审核后上墙，违规内容将被删除</li>
            <li>🎵 点击右下角音乐按钮，享受树洞专属BGM</li>
            <li>📱 截图分享到QQ频道，和小伙伴一起聊</li>
          </ul>
          <div class="intro-divider"></div>
          <p class="intro-admin">✨ 管理员寄语：</p>
          <p class="intro-message">“这里是广丰校圈，你的青春树洞。无论开心还是难过，我们都在这儿听你说。”</p>
          <p class="intro-footer">—— 赣饶·广丰校圈 团队</p>
        </div>
        <img :src="channel.qrcode" class="intro-qrcode" />
        <p class="intro-qrcode-tip">扫码加入QQ频道，解锁更多功能</p>
        <van-button type="primary" round block @click="showIntro = false">我知道啦</van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showPostDialog" position="bottom" :style="{ height: '90%' }" round class="post-popup">
      <PostEditor @submit="onPostSubmit" @close="showPostDialog = false" />
    </van-popup>

    <van-action-sheet v-model:show="showSchoolPicker" title="选择学校" :close-on-click-action="false">
      <div class="option-list">
        <div
          v-for="item in schoolOptions"
          :key="item.value"
          class="option-item"
          :class="{ active: tempSchool === item.value }"
          @click="tempSchool = item.value"
        >
          <span class="option-text">{{ item.text }}</span>
          <van-icon v-if="tempSchool === item.value" name="success" color="#4A90E2" size="18" />
        </div>
      </div>
      <div class="action-footer">
        <button class="action-cancel" @click="showSchoolPicker = false">取消</button>
        <button class="action-confirm" @click="confirmSchool">确定</button>
      </div>
    </van-action-sheet>

    <van-popup v-model:show="showQrcode" :style="{ width: '80%', padding: '20px', borderRadius: '20px' }" round>
      <div style="text-align: center">
        <img :src="channel.qrcode" style="width: 100%; border-radius: 16px;" />
        <p style="margin-top: 12px; color: #4A90E2;">扫码加入赣饶·广丰校圈</p>
      </div>
    </van-popup>

    <van-popup v-model:show="showDonate" :style="{ width: '90%', padding: '24px 20px', borderRadius: '28px' }" round>
      <div class="donate-container">
        <h3 class="donate-title">✨ 支持赣饶·广丰校圈</h3>
        <p class="donate-subtitle">每一份赞赏都是我们持续运营的动力 ❤️</p>
        <div class="donate-message">
          <p>树洞的服务器、审核、开发都需要成本，</p>
          <p>如果你喜欢这里，欢迎请我们喝杯奶茶～</p>
        </div>
        <img :src="donateQrcode" class="donate-qrcode" />
        <p class="donate-tip">微信/支付宝扫码，金额随意</p>
        <p class="donate-thanks">🙏 感谢你的支持！</p>
        <van-button type="primary" round block @click="showDonate = false">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { supabase } from '../config/supabase.js'
import { channelConfig } from '../config/channel.js'
import { schoolOptions as schools } from '../config/schools.js'
import PostCard from '../components/PostCard.vue'
import PostEditor from '../components/PostEditor.vue'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const channel = reactive(channelConfig)
const donateQrcode = new URL('/images/donate.jpg', import.meta.url).href
const channelAvatar = ref(null)
try {
  channelAvatar.value = new URL('/images/channel-avatar.jpg', import.meta.url).href
} catch {
  channelAvatar.value = null
}
// ========== 品牌点击彩蛋 =======
const brandClickCount = ref(0)
let clickTimer = null

const handleBrandClick = () => {
  brandClickCount.value++
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
brandClickCount.value = 0}, 800)
if (brandClickCount.value >= 5) {
  brandClickCount.value = 0
  clearTimeout(clickTimer)
  router.push('/secret')
}
}

// ========== 实时时钟 ==========
const currentDate = ref('')
const currentTime = ref('')
let timer = null

const updateClock = () => {
  const now = new Date()
  currentDate.value = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

// ========== 纸条 ==========
const quotes = [
  '你错的每一道题，都是为了遇见对的人。',
  '今天不开心也没关系，树洞永远在这里听你说。',
  '广丰的风会记得你的努力。',
  '别看了，说的就是你——明天一定会更好！',
  '赣饶·广丰校圈，陪你度过青春。',
  '你是我眼底藏不住的多巴胺，每一次对视，都掀起一场盛大的心动海啸。',
  '你是抚平我所有人生褶皱的内啡肽，在兵荒马乱的日子里，给我绵长的温柔和安宁。',
  '万家灯火阑珊，唯有你在的地方，是催产素给的归属感，是我永远的港湾。',
  '你此刻困于其中的题海与考场，从来不是人生的终章，只是你奔赴山海的序章。',
  '所有让你辗转难眠的烦恼，放在十年的时间尺度里看，都只是人生路上一粒微不足道的尘埃。',
  '风过林梢，骄阳正好，你正当年少，别怕前路迢迢。',
]
const currentQuote = ref(quotes[0])
const refreshQuote = () => {
  const others = quotes.filter(q => q !== currentQuote.value)
  currentQuote.value = others[Math.floor(Math.random() * others.length)]
}

// ========== 分类 ==========
const categories = [
  { label: '全部', value: 'all', icon: '📋' },
  { label: '表白', value: 'confession', icon: '❤️' },
  { label: '吐槽', value: 'complaint', icon: '💬' },
  { label: '树洞', value: 'treehole', icon: '🌲' },
  { label: '求助', value: 'help', icon: '🆘' },
  { label: '其他', value: 'other', icon: '📝' },
]
const currentCategory = ref('all')

// ========== 学校 ==========
const schoolOptions = schools
const currentSchool = ref(null)
const tempSchool = ref(null)
const currentSchoolLabel = computed(() => {
  const opt = schoolOptions.find(s => s.value === currentSchool.value)
  return opt ? opt.text : '🌍 赣饶·广丰（全区）'
})
const confirmSchool = () => {
  currentSchool.value = tempSchool.value
  showSchoolPicker.value = false
  onRefresh()
}

// ========== 我的帖子 ==========
const showMyPostsOnly = ref(false)
const toggleMyPosts = () => {
  showMyPostsOnly.value = !showMyPostsOnly.value
  onRefresh()
}

// ========== 排序 ==========
const sortBy = ref('latest')
const toggleSort = () => {
  sortBy.value = sortBy.value === 'latest' ? 'hot' : 'latest'
  onRefresh()
}

// ========== 帖子数据 ==========
const posts = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10

// ========== UI状态 ==========
const showIntro = ref(false)
const showPostDialog = ref(false)
const showSchoolPicker = ref(false)
const showQrcode = ref(false)
const showDonate = ref(false)

// ========== 全局音乐 ==========
// 注意：需要在 App.vue 中设置 window.$music，否则此处回退到本地状态
const musicPlaying = computed(() => {
  if (window.$music?.musicPlaying) return window.$music.musicPlaying.value
  return false
})
const toggleMusic = () => {
  if (window.$music?.toggleMusic) {
    window.$music.toggleMusic()
  } else {
    // 降级：本地音乐播放（不跨页面）
    if (!audio.value) {
      const randomIndex = Math.floor(Math.random() * musicTracks.length)
      currentTrackIndex.value = randomIndex
      audio.value = new Audio(musicTracks[randomIndex])
      audio.value.loop = false
      audio.value.onended = () => {
        let nextIndex = Math.floor(Math.random() * musicTracks.length)
        while (nextIndex === currentTrackIndex.value && musicTracks.length > 1) {
          nextIndex = Math.floor(Math.random() * musicTracks.length)
        }
        currentTrackIndex.value = nextIndex
        audio.value.src = musicTracks[nextIndex]
        audio.value.play()
      }
    }
    if (localMusicPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
    localMusicPlaying.value = !localMusicPlaying.value
  }
}

// 本地音乐降级（仅在没有全局音乐时使用）
const localMusicPlaying = ref(false)
const audio = ref(null)
const currentTrackIndex = ref(0)
const musicTracks = ['/music/bgm1.mp3', '/music/bgm2.mp3', '/music/bgm3.mp3']

// ========== 用户标识 ==========
const getUserToken = () => {
  let token = localStorage.getItem('ganrao_token')
  if (!token) {
    token = uuidv4()
    localStorage.setItem('ganrao_token', token)
  }
  return token
}

const openChannel = () => window.open(channel.url, '_blank')

const switchCategory = (cat) => {
  currentCategory.value = cat
  onRefresh()
}

const onLoad = async () => {
  loading.value = true
  let query = supabase
    .from('posts')
    .select('*')
    .eq('is_deleted', false)
  if (sortBy.value === 'hot') {
    query = query.order('likes', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range((page.value - 1) * pageSize, page.value * pageSize - 1)

  if (currentCategory.value !== 'all') query = query.eq('category', currentCategory.value)
  if (currentSchool.value) query = query.eq('school', currentSchool.value)
  else query = query.is('school', null)

  if (showMyPostsOnly.value) query = query.eq('user_token', getUserToken())

  const { data, error } = await query
  if (error) {
    showToast('加载失败')
    loading.value = false
    return
  }

  const formatted = data.map(p => ({
    id: p.id,
    content: p.content,
    category: p.category,
    school: p.school,
    anonymousName: p.anonymous_name,
    images: p.images || [],
    video: p.video,
    likes: p.likes || 0,
    commentCount: p.comment_count || 0,
    createdAt: p.created_at,
  }))

  if (page.value === 1) posts.value = formatted
  else posts.value.push(...formatted)

  if (data.length < pageSize) finished.value = true
  page.value++
  loading.value = false
  refreshing.value = false
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  onLoad()
}
const goRandomPost = async () => {
  // 构建与当前筛选条件完全一致的查询
  let query = supabase
    .from('posts')
    .select('id')
    .eq('is_deleted', false)

  if (currentCategory.value !== 'all') query = query.eq('category', currentCategory.value)
  if (currentSchool.value) query = query.eq('school', currentSchool.value)
  else query = query.is('school', null)

  if (showMyPostsOnly.value) {
    query = query.eq('user_token', getUserToken())
  }

  // 获取所有符合条件的帖子ID
  const { data, error } = await query

  if (error) {
    console.error('随机获取失败:', error)
    showToast('加载失败，请重试')
    return
  }

  if (!data || data.length === 0) {
    showToast('暂时没有符合条件的帖子')
    return
  }

  // 随机选取一个ID
  const randomIndex = Math.floor(Math.random() * data.length)
  const randomId = data[randomIndex].id

  router.push(`/post/${randomId}`)
}

const handleLike = async (postId) => {
  const token = getUserToken()
  const { data: exist } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_token', token)
    .maybeSingle()

  if (exist) {
    showToast('已经点过赞啦')
    return
  }

  await supabase.from('likes').insert({ post_id: postId, user_token: token })
  await supabase.rpc('increment_likes', { post_id: postId })

  const post = posts.value.find(p => p.id === postId)
  if (post) post.likes++
  showSuccessToast('点赞成功')
}

const handleShare = async (post) => {
  const postUrl = `${window.location.origin}/post/${post.id}`
  const shareText = `【赣饶·广丰校圈】${post.anonymousName}：${post.content.slice(0, 50)}... 点击查看：${postUrl}`
  
  if (navigator.share) {
    navigator.share({ title: '赣饶·广丰校圈', text: shareText, url: postUrl }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(shareText).then(() => showToast('链接已复制')).catch(() => showToast('分享失败'))
  }
}

const goDetail = (id) => router.push(`/post/${id}`)
const onPostSubmit = async (formData) => {
  const token = getUserToken()

  // 1. 获取下一个帖子编号（基于未删除帖子）
  const { data: numberData, error: numberError } = await supabase
    .rpc('next_post_number')
  if (numberError) {
    showToast('获取编号失败，请重试')
    return
  }
  const postNumber = numberData

  // 2. 随机匿名名称（不包含数字）
  const nouns = ['橘子', '西瓜', '枫叶', '月光', '星辰', '海风', '青柠', '薄荷', '梧桐', '星河', '晚风', '晨曦', '细雨']
  const anonymousName = `匿名${nouns[Math.floor(Math.random() * nouns.length)]}`

  const images = formData.images.map(img => img.preview)
  let video = null
  if (formData.video) {
    video = {
      url: formData.video.preview,
      duration: formData.video.duration,
      thumbnail: formData.video.preview,
    }
  }

  // 临时占位帖
  const tempId = `temp-${Date.now()}`
  const tempPost = {
    id: tempId,
    post_number: postNumber,
    content: formData.content,
    category: formData.category,
    school: formData.school,
    anonymousName: anonymousName,
    images,
    video,
    likes: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  }

  posts.value.unshift(tempPost)
  showPostDialog.value = false
  showSuccessToast('投稿成功！')

  const { data, error } = await supabase
    .from('posts')
    .insert({
      post_number: postNumber,
      content: formData.content,
      category: formData.category,
      school: formData.school,
      anonymous_name: anonymousName,
      user_token: token,
      images,
      video,
    })
    .select()
    .single()

  if (error) {
    showToast('投稿同步失败，请刷新')
    posts.value = posts.value.filter(p => p.id !== tempId)
    return
  }

  const realPost = {
    id: data.id,
    post_number: data.post_number,
    content: data.content,
    category: data.category,
    school: data.school,
    anonymousName: data.anonymous_name,
    images: data.images || [],
    video: data.video,
    likes: 0,
    commentCount: 0,
    createdAt: data.created_at,
  }

  const index = posts.value.findIndex(p => p.id === tempId)
  if (index !== -1) posts.value[index] = realPost
  else posts.value.unshift(realPost)

  onRefresh()
}
onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
  onLoad()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (audio.value) {
    audio.value.pause()
    audio.value = null
  }
})
</script>
<style scoped>
.home {
  min-height: 100vh;
  background: #F4F9FF;
  padding-bottom: 80px;
}

/* ========== 导航栏 + 纸条融合区域 ========== */
.hero-section {
  background: linear-gradient(145deg, #4A90E2 0%, #5BA0F2 100%);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
  margin-bottom: 4px;
}
.brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.header-left {
  width: 48px;
  cursor: pointer;
}
.header-avatar {
  width: 45px;
  height: 45px;
  background: rgba(255,255,255,0.25);
  border-radius: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.8);
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.header-center {
  flex: 1;
  text-align: center;
}
.brand-name {
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.brand-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  margin-left: 4px;
}
.header-right {
  width: 100px;
  display: flex;
  justify-content: flex-end;
}
.live-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(255,255,255,0.15);
  padding: 4px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}
.clock-date {
  font-size: 11px;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}
.clock-time {
  font-size: 14px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}

/* 嵌入纸条 */
.quote-embedded {
  margin: 0 16px 14px;
  padding: 12px 16px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  cursor: pointer;
}
.quote-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.quote-icon {
  font-size: 20px;
}
.quote-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #2C3E50;
  text-indent: 2em;
}
.quote-refresh {
  color: #4A90E2;
  padding: 4px;
  background: rgba(74, 144, 226, 0.08);
  border-radius: 16px;
}
.quote-brand {
  text-align: right;
  font-size: 11px;
  color: #7E9BB5;
}

/* ========== 分类区域 ========== */
.category-wrapper {
  padding: 0 14px;
  margin: 4px 0 2px;
}
.category-container {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: 24px;
  padding: 8px 4px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.04);
  border: 1px solid rgba(74, 144, 226, 0.06);
}
.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  cursor: pointer;
  opacity: 0.65;
  transition: all 0.15s;
}
.category-item.active {
  opacity: 1;
  transform: translateY(-2px);
}
.cat-emoji {
  font-size: 22px;
}
.cat-label {
  font-size: 11px;
  color: #2C3E50;
  font-weight: 500;
}

/* ========== 筛选行 ========== */
.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 16px 8px;
}
.school-trigger,
.my-posts-trigger,
.sort-trigger,
.random-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border-radius: 30px;
  font-size: 13px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(74, 144, 226, 0.04);
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  height: 36px;
  box-sizing: border-box;
  white-space: nowrap;
}
.school-trigger {
  color: #4A90E2;
}
.my-posts-trigger {
  color: #7E9BB5;
}
.sort-trigger {
  color: #7E9BB5;
}
.random-trigger {
  color: #7E9BB5;
  margin-left: auto;
}
.my-posts-trigger.active {
  background: #4A90E2;
  color: white;
}
.school-trigger:active,
.my-posts-trigger:active,
.sort-trigger:active,
.random-trigger:active {
  background: rgba(74, 144, 226, 0.08);
  color: #4A90E2;
}
.my-posts-trigger.active:active {
  background: #3d7fd1;
  color: white;
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}
.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #2C3E50;
}
.empty-desc {
  font-size: 14px;
  color: #7E9BB5;
  margin: 8px 0 16px;
}
.empty-qrcode {
  width: 150px;
  height: 150px;
  border-radius: 24px;
  margin-top: 16px;
  border: 2px solid rgba(74, 144, 226, 0.1);
}

/* ========== 底部功能栏 ========== */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(74, 144, 226, 0.15);
  box-shadow: 0 -2px 10px rgba(74, 144, 226, 0.05);
  z-index: 15;
}
.bottom-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-radius: 20px;
  color: #7E9BB5;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 52px;
}
.bottom-action:active {
  background: rgba(74, 144, 226, 0.08);
  color: #4A90E2;
}
.bottom-post-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: #4A90E2;
  border: none;
  border-radius: 40px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 6px 14px rgba(74, 144, 226, 0.3);
  cursor: pointer;
  transition: all 0.15s;
}
.bottom-post-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.25);
}

/* ========== 介绍弹窗 ========== */
.intro-container {
  text-align: left;
}
.intro-title {
  font-size: 22px;
  font-weight: 700;
  color: #4A90E2;
  margin-bottom: 8px;
  text-align: center;
}
.intro-welcome {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #2C3E50;
}
.intro-list {
  padding-left: 20px;
  margin: 12px 0;
  color: #34495E;
}
.intro-list li {
  margin: 8px 0;
  font-size: 14px;
}
.intro-divider {
  height: 1px;
  background: rgba(74, 144, 226, 0.15);
  margin: 16px 0;
}
.intro-admin {
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 6px;
}
.intro-message {
  font-style: italic;
  color: #5a6c7e;
  padding-left: 12px;
  border-left: 3px solid #4A90E2;
  margin: 8px 0;
}
.intro-footer {
  text-align: right;
  color: #7E9BB5;
  font-size: 13px;
  margin-top: 12px;
}
.intro-qrcode {
  width: 150px;
  height: 150px;
  border-radius: 20px;
  margin: 16px auto 8px;
  display: block;
}
.intro-qrcode-tip {
  text-align: center;
  font-size: 13px;
  color: #7E9BB5;
  margin-bottom: 20px;
}

/* ========== 打赏弹窗 ========== */
.donate-container {
  text-align: center;
}
.donate-title {
  font-size: 22px;
  font-weight: 700;
  color: #4A90E2;
  margin-bottom: 6px;
}
.donate-subtitle {
  font-size: 14px;
  color: #7E9BB5;
  margin-bottom: 16px;
}
.donate-message {
  background: #F4F9FF;
  padding: 14px 18px;
  border-radius: 20px;
  font-size: 14px;
  color: #2C3E50;
  margin-bottom: 20px;
}
.donate-qrcode {
  width: 180px;
  height: 180px;
  border-radius: 24px;
  margin: 10px auto;
  display: block;
  border: 2px solid rgba(74, 144, 226, 0.1);
}
.donate-tip {
  font-size: 13px;
  color: #7E9BB5;
  margin: 8px 0;
}
.donate-thanks {
  font-size: 16px;
  font-weight: 600;
  color: #F39C12;
  margin: 12px 0 20px;
}

/* ========== 学校选择器 ========== */
.option-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
}
.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.option-item.active {
  background: #F4F9FF;
}
.option-text {
  font-size: 16px;
  color: #2C3E50;
}
.action-footer {
  display: flex;
  padding: 12px 20px;
  border-top: 1px solid #EEF2F6;
}
.action-cancel,
.action-confirm {
  flex: 1;
  padding: 14px 0;
  border-radius: 30px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.action-cancel {
  background: #F0F4F9;
  color: #7E9BB5;
  margin-right: 12px;
}
.action-cancel:active {
  background: #e0e6ed;
}
.action-confirm {
  background: #4A90E2;
  color: white;
  font-weight: 600;
}
.action-confirm:active {
  background: #3d7fd1;
}

/* ========== 投稿弹窗居中 ========== */
.post-popup {
  left: 50% !important;
  transform: translateX(-50%) !important;
  right: auto !important;
  width: 100% !important;
  max-width: 500px !important;
}
</style>
<template>
  <div class="editor">
    <!-- 头部：取消 + 标题 + 发布 -->
    <div class="editor-header">
      <span class="cancel-btn" @click="$emit('close')">取消</span>
      <span class="title">📝 匿名投稿</span>
      <button class="submit-btn" @click="submit">发布</button>
    </div>

    <!-- 投稿信息卡片：序号 + 时间 + 鼓励语 -->
    <div class="post-info-card">
      <div class="info-row">
        <span class="info-icon">🌱</span>
        <span class="info-text">你是第 <strong>{{ postNumber }}</strong> 位倾诉者</span>
      </div>
      <div class="info-row">
        <span class="info-icon">🕒</span>
        <span class="info-text">{{ currentDateTime }}</span>
      </div>
      <div class="info-row tip">
        <span class="info-icon">💭</span>
        <span class="info-text">{{ randomTip }}</span>
      </div>
    </div>

    <!-- 正文输入区 -->
    <div class="editor-body">
      <div class="content-card">
        <textarea
          v-model="form.content"
          placeholder="此刻想说什么..."
          maxlength="500"
          class="content-input"
        />
        <div class="char-count">{{ form.content.length }}/500</div>
      </div>

      <!-- 图片上传 -->
      <div class="section-card">
        <div class="card-header">
          <span class="card-title">📷 图片</span>
          <span class="card-hint">最多3张</span>
        </div>
        <div class="image-grid">
          <div v-for="(img, i) in form.images" :key="i" class="image-item">
            <img :src="img.preview" />
            <div class="remove-btn" @click="removeImage(i)">
              <van-icon name="cross" size="14" color="#fff" />
            </div>
          </div>
          <div v-if="form.images.length < 3" class="upload-btn" @click="$refs.imageInput.click()">
            <van-icon name="plus" size="28" color="#A0BBD0" />
          </div>
        </div>
        <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="onImageChange" />
      </div>

      <!-- 视频上传 -->
      <div class="section-card">
        <div class="card-header">
          <span class="card-title">🎬 视频</span>
          <span class="card-hint">≤30秒</span>
        </div>
        <div v-if="!form.video" class="upload-btn video-upload" @click="$refs.videoInput.click()">
          <van-icon name="video-o" size="22" color="#A0BBD0" />
          <span>选择视频</span>
        </div>
        <div v-else class="video-preview">
          <video :src="form.video.preview" controls />
          <div class="remove-video" @click="form.video = null">
            <van-icon name="cross" size="16" color="#fff" />
          </div>
          <span class="video-duration">{{ formatDuration(form.video.duration) }}</span>
        </div>
        <input ref="videoInput" type="file" accept="video/*" style="display:none" @change="onVideoChange" />
      </div>

      <!-- 分类选择 -->
      <div class="selector-card" @click="showCategory = true">
        <div class="selector-left">
          <span class="selector-icon">🏷️</span>
          <span class="selector-label">分类</span>
        </div>
        <div class="selector-right">
          <span class="selector-value">{{ categoryLabel }}</span>
          <van-icon name="arrow" size="16" color="#A0BBD0" />
        </div>
      </div>

      <!-- 学校选择 -->
      <div class="selector-card" @click="showSchool = true">
        <div class="selector-left">
          <span class="selector-icon">🏫</span>
          <span class="selector-label">学校</span>
        </div>
        <div class="selector-right">
          <span class="selector-value">{{ schoolLabel }}</span>
          <van-icon name="arrow" size="16" color="#A0BBD0" />
        </div>
      </div>

      <!-- 温馨提示 -->
      <div class="editor-tip">
        <van-icon name="info-o" size="14" />
        <span>匿名发布，审核后上墙，请遵守校圈公约</span>
      </div>
    </div>

    <!-- 分类选择器 -->
    <van-action-sheet v-model:show="showCategory" title="选择分类" :close-on-click-action="false">
      <div class="picker-container">
        <div
          v-for="item in categoryOptions"
          :key="item.value"
          class="picker-item"
          :class="{ active: tempCategory === item.value }"
          @click="tempCategory = item.value"
        >
          <span>{{ item.text }}</span>
          <van-icon v-if="tempCategory === item.value" name="success" color="#4A90E2" size="18" />
        </div>
      </div>
      <div class="picker-footer">
        <button class="picker-cancel" @click="showCategory = false">取消</button>
        <button class="picker-confirm" @click="confirmCategory">确定</button>
      </div>
    </van-action-sheet>

    <!-- 学校选择器 -->
    <van-action-sheet v-model:show="showSchool" title="选择学校" :close-on-click-action="false">
      <div class="picker-container">
        <div
          v-for="item in schoolOptions"
          :key="item.value"
          class="picker-item"
          :class="{ active: tempSchool === item.value }"
          @click="tempSchool = item.value"
        >
          <span>{{ item.text }}</span>
          <van-icon v-if="tempSchool === item.value" name="success" color="#4A90E2" size="18" />
        </div>
      </div>
      <div class="picker-footer">
        <button class="picker-cancel" @click="showSchool = false">取消</button>
        <button class="picker-confirm" @click="confirmSchool">确定</button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { supabase } from '../config/supabase.js'
import { schoolOptions as schools } from '../config/schools.js'

const emit = defineEmits(['submit', 'close'])

// 表单数据
const form = reactive({
  content: '',
  category: 'confession',
  school: null,
  images: [],
  video: null,
})

// UI 状态
const showCategory = ref(false)
const showSchool = ref(false)
const tempCategory = ref('confession')
const tempSchool = ref(null)

// 投稿序号
const postNumber = ref(0)
const fetchPostCount = async () => {
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
  postNumber.value = (count || 0) + 1   // 下一个序号
}

// 实时时钟
const currentDateTime = ref('')
let timer = null
const updateClock = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentDateTime.value = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 随机鼓励语
const tips = [
  '你的心事，树洞在听',
  '说出来会好受些',
  '勇敢表达，不留遗憾',
  '每一个声音都值得被听见',
  '匿名是一种自由',
  '这里很安全，放心说',
  '或许有人和你想的一样',
  '今天的你，辛苦了',
  '风会记得你的故事',
  '把烦恼扔进树洞吧',
]
const randomTip = ref(tips[0])
const refreshTip = () => {
  const others = tips.filter(t => t !== randomTip.value)
  randomTip.value = others[Math.floor(Math.random() * others.length)]
}

// 分类选项
const categoryOptions = [
  { text: '❤️ 表白', value: 'confession' },
  { text: '💬 吐槽', value: 'complaint' },
  { text: '🌲 树洞', value: 'treehole' },
  { text: '🆘 求助', value: 'help' },
  { text: '📝 其他', value: 'other' },
]
const categoryLabel = computed(() => {
  const opt = categoryOptions.find(c => c.value === form.category)
  return opt ? opt.text.replace(/[❤️💬🌲🆘📝]/g, '').trim() : '表白'
})
const confirmCategory = () => {
  form.category = tempCategory.value
  showCategory.value = false
}

// 学校选项（从配置文件导入）
const schoolOptions = schools
const schoolLabel = computed(() => {
  const opt = schoolOptions.find(s => s.value === form.school)
  return opt ? opt.text : '🌍 赣饶·广丰（全区）'
})
const confirmSchool = () => {
  form.school = tempSchool.value
  showSchool.value = false
}

// 图片上传
const onImageChange = (e) => {
  const files = Array.from(e.target.files)
  files.forEach(f => {
    if (form.images.length >= 3) return showToast('最多3张')
    const reader = new FileReader()
    reader.onload = ev => form.images.push({ file: f, preview: ev.target.result })
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}
const removeImage = (i) => form.images.splice(i, 1)

// 视频上传
const onVideoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const video = document.createElement('video')
  video.src = URL.createObjectURL(file)
  video.onloadedmetadata = () => {
    if (video.duration > 30) return showToast('视频不能超过30秒')
    const reader = new FileReader()
    reader.onload = ev => {
      form.video = {
        file,
        preview: ev.target.result,
        duration: Math.floor(video.duration),
      }
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}
const formatDuration = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 提交
const submit = () => {
  if (!form.content.trim()) return showToast('内容不能为空')
  emit('submit', { ...form })
  form.content = ''
  form.images = []
  form.video = null
}

// 初始化
onMounted(() => {
  fetchPostCount()
  updateClock()
  timer = setInterval(updateClock, 1000)
  refreshTip()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F8FCFF;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: white;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
}
.cancel-btn {
  font-size: 16px;
  color: #7E9BB5;
  cursor: pointer;
}
.title {
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
}
.submit-btn {
  background: #4A90E2;
  border: none;
  color: white;
  padding: 10px 22px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.25);
  cursor: pointer;
}
.submit-btn:active {
  transform: scale(0.95);
}

/* 信息卡片 */
.post-info-card {
  background: white;
  margin: 16px 16px 0;
  padding: 16px 18px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.04);
  border: 1px solid rgba(74, 144, 226, 0.08);
}
.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}
.info-text {
  font-size: 14px;
  color: #34495E;
}
.info-text strong {
  color: #4A90E2;
  font-size: 18px;
  margin: 0 2px;
}
.info-row.tip .info-text {
  color: #7E9BB5;
  font-style: italic;
}

/* 正文区域 */
.editor-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.content-card {
  background: white;
  border-radius: 24px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.04);
}
.content-input {
  width: 100%;
  height: 140px;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  background: transparent;
}
.char-count {
  text-align: right;
  color: #A0BBD0;
  font-size: 13px;
  margin-top: 8px;
}

/* 上传卡片 */
.section-card {
  background: white;
  border-radius: 24px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.04);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-title {
  font-weight: 650;
  color: #2C3E50;
  font-size: 16px;
}
.card-hint {
  font-size: 12px;
  color: #A0BBD0;
}
.image-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.image-item {
  position: relative;
  width: 90px;
  height: 90px;
}
.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.15);
}
.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background: #4A90E2;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.upload-btn {
  width: 90px;
  height: 90px;
  background: #F0F7FF;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #A0BBD0;
  cursor: pointer;
  border: 1px dashed rgba(74, 144, 226, 0.3);
}
.video-upload {
  width: auto;
  padding: 14px 20px;
  height: auto;
  flex-direction: row;
}
.video-preview {
  position: relative;
}
.video-preview video {
  width: 100%;
  max-height: 200px;
  border-radius: 16px;
}
.remove-video {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: #4A90E2;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
}

/* 选择卡片 */
.selector-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 24px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.04);
  cursor: pointer;
}
.selector-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.selector-icon {
  font-size: 24px;
}
.selector-label {
  font-size: 16px;
  font-weight: 500;
  color: #2C3E50;
}
.selector-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.selector-value {
  font-size: 15px;
  color: #4A90E2;
  font-weight: 500;
}

/* 底部提示 */
.editor-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
  color: #7E9BB5;
  font-size: 13px;
}

/* 选择器弹窗 */
.picker-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
}
.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
}
.picker-item.active {
  background: #F4F9FF;
}
.picker-footer {
  display: flex;
  padding: 12px 20px;
  border-top: 1px solid #EEF2F6;
}
.picker-cancel, .picker-confirm {
  flex: 1;
  padding: 14px 0;
  border-radius: 30px;
  font-size: 16px;
  border: none;
  cursor: pointer;
}
.picker-cancel {
  background: #F0F4F9;
  color: #7E9BB5;
  margin-right: 12px;
}
.picker-confirm {
  background: #4A90E2;
  color: white;
  font-weight: 600;
}
</style>
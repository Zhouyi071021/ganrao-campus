<template>
  <div class="secret-center">
    <header class="center-header">
      <van-icon name="arrow-left" size="24" @click="$router.back()" />
      <span class="header-title">✨ 秘密基地</span>
      <span style="width: 24px"></span>
    </header>

    <div class="welcome-card">
      <div class="welcome-icon">🎉</div>
      <p class="welcome-text">恭喜你发现隐藏空间！</p>
      <p class="welcome-sub">课间十分钟，来这里放松一下吧～</p>
    </div>

    <div class="feature-grid">
      <div class="feature-card" @click="activeTab = 'turtle'">
        <div class="feature-icon">🐢</div>
        <div class="feature-info">
          <h3>海龟汤推理馆</h3>
          <p>情景谜题，脑洞大开</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'personality'">
        <div class="feature-icon">🔬</div>
        <div class="feature-info">
          <h3>性格实验室</h3>
          <p>3分钟测出你的隐藏性格</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'guess'">
        <div class="feature-icon">🎯</div>
        <div class="feature-info">
          <h3>猜数字挑战</h3>
          <p>1-100，10次机会</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'fortune'">
        <div class="feature-icon">🔮</div>
        <div class="feature-info">
          <h3>今日运势签</h3>
          <p>每日一签，好运连连</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'photo'">
        <div class="feature-icon">📸</div>
        <div class="feature-info">
          <h3>校园照片墙</h3>
          <p>广丰的风景与人</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'note'">
        <div class="feature-icon">💬</div>
        <div class="feature-info">
          <h3>树洞小纸条</h3>
          <p>随机匿名心事</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
      <div class="feature-card" @click="activeTab = 'wheel'">
        <div class="feature-icon">🎰</div>
        <div class="feature-info">
          <h3>决策转盘</h3>
          <p>选择困难？转一下</p>
        </div>
        <van-icon name="arrow" size="16" color="#A0BBD0" />
      </div>
    </div>

    <div class="content-panel">
      <!-- 海龟汤 -->
      <div v-if="activeTab === 'turtle'" class="turtle-panel">
        <div class="panel-title">
          <span>🐢 海龟汤推理馆</span>
          <span class="progress">{{ currentTurtleIndex + 1 }}/{{ turtleList.length }}</span>
        </div>
        <div class="turtle-card">
          <div class="turtle-question">{{ currentTurtle.question }}</div>
          <div class="turtle-hint" v-if="showTurtleHint">
            <van-icon name="info-o" size="14" color="#F39C12" />
            <span>💡 提示：{{ currentTurtle.hint }}</span>
          </div>
          <div class="turtle-answer" v-if="showTurtleAnswer">
            <van-icon name="success" size="14" color="#E74C3C" />
            <span>🔎 汤底：{{ currentTurtle.answer }}</span>
          </div>
        </div>
        <div class="turtle-actions">
          <van-button size="small" plain round @click="showTurtleHint = !showTurtleHint">
            {{ showTurtleHint ? '隐藏' : '显示' }}提示
          </van-button>
          <van-button size="small" plain round @click="showTurtleAnswer = !showTurtleAnswer">
            {{ showTurtleAnswer ? '隐藏' : '显示' }}汤底
          </van-button>
          <van-button size="small" type="primary" round @click="nextTurtle">
            下一题
          </van-button>
        </div>
        <div class="turtle-tip">
          <van-icon name="question-o" size="14" />
          <span>海龟汤玩法：根据汤面推理故事真相，提示和汤底可辅助思考</span>
        </div>
      </div>

      <!-- 性格实验室 -->
      <div v-if="activeTab === 'personality'" class="personality-panel">
        <div class="panel-title">🔬 性格实验室</div>
        <div v-if="!personalityResult" class="quiz-container">
          <div class="quiz-progress">
            <span>第 {{ currentQuizIndex + 1 }} / {{ quizQuestions.length }} 题</span>
          </div>
          <div class="quiz-question">{{ quizQuestions[currentQuizIndex]?.question }}</div>
          <div class="quiz-options">
            <div
              v-for="(option, idx) in quizQuestions[currentQuizIndex]?.options"
              :key="idx"
              class="quiz-option"
              @click="selectQuizOption(idx)"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
              <span>{{ option }}</span>
            </div>
          </div>
        </div>
        <div v-else class="quiz-result">
          <div class="result-avatar">{{ personalityResult.emoji }}</div>
          <div class="result-type">{{ personalityResult.type }}</div>
          <div class="result-desc">{{ personalityResult.desc }}</div>
          <div class="result-tags">
            <span v-for="tag in personalityResult.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <van-button type="primary" round block @click="resetQuiz" style="margin-top: 24px;">
            重新测试
          </van-button>
        </div>
      </div>

      <!-- 猜数字挑战 -->
      <div v-if="activeTab === 'guess'" class="guess-panel">
        <div class="panel-title">🎯 猜数字挑战</div>
        <div class="guess-game">
          <div class="guess-range">1 - 100</div>
          <div class="guess-chances">
            <van-icon name="fire-o" size="16" color="#F39C12" />
            <span>剩余机会：{{ 10 - guessCount }} 次</span>
          </div>
          <div class="guess-history" v-if="guessHistory.length > 0">
            <span v-for="(item, idx) in guessHistory" :key="idx" class="history-item" :class="item.result">
              {{ item.number }}
            </span>
          </div>
          <div class="guess-result" v-if="guessResult">
            <van-icon :name="guessResult.includes('🎉') ? 'like' : 'info-o'" size="18" />
            <span>{{ guessResult }}</span>
          </div>
          <van-field
            v-if="!gameOver && !gameWon"
            v-model="guessNumber"
            type="number"
            placeholder="输入 1-100 的数字"
            center
            clearable
          />
          <van-button
            v-if="!gameOver && !gameWon"
            type="primary"
            round
            block
            @click="makeGuess"
            style="margin-top: 16px;"
          >
            猜一下
          </van-button>
          <van-button plain round block @click="resetGuess" style="margin-top: 12px;">
            {{ gameOver || gameWon ? '再来一局' : '重新开始' }}
          </van-button>
        </div>
      </div>

      <!-- 今日运势签 -->
      <div v-if="activeTab === 'fortune'" class="fortune-panel">
        <div class="panel-title">🔮 今日运势签</div>
        <div class="fortune-card" v-if="currentFortune">
          <div class="fortune-icon">{{ currentFortune.icon }}</div>
          <div class="fortune-level">{{ currentFortune.level }}</div>
          <div class="fortune-desc">{{ currentFortune.desc }}</div>
          <div class="fortune-detail">
            <div class="detail-item">
              <span class="detail-label">🍀 幸运数字</span>
              <span class="detail-value">{{ currentFortune.number }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">🎨 幸运色</span>
              <span class="detail-value">{{ currentFortune.color }}</span>
            </div>
          </div>
          <div class="fortune-advice">
            <van-icon name="bell" size="14" />
            <span>{{ currentFortune.advice }}</span>
          </div>
          <div class="fortune-date">{{ todayDate }}</div>
        </div>
        <van-button
          type="primary"
          round
          block
          @click="drawFortune"
          :disabled="fortuneDrawnToday"
          style="margin-top: 20px;"
        >
          {{ fortuneDrawnToday ? '今日已抽签' : '抽取今日签' }}
        </van-button>
        <p class="fortune-tip">✨ 每日仅可抽一次，珍惜你的运势</p>
      </div>

      <!-- 校园照片墙 -->
      <div v-if="activeTab === 'photo'" class="photo-panel">
        <div class="photo-header">
          <span>📸 广丰记忆</span>
          <van-uploader
            v-model="uploadedPhotos"
            :after-read="afterReadPhoto"
            accept="image/*"
            :preview-full-image="true"
          >
            <van-button size="small" type="primary" round>上传照片</van-button>
          </van-uploader>
        </div>
        <div class="photo-grid">
          <div v-for="(photo, i) in photoList" :key="i" class="photo-item">
            <img :src="photo.url" />
            <van-icon name="cross" class="photo-remove" @click="removePhoto(i)" />
          </div>
          <div v-if="photoList.length === 0" class="empty-photos">
            <van-icon name="photo-o" size="48" color="#D0E0F0" />
            <p>还没有照片，快来上传第一张吧 📸</p>
          </div>
        </div>
      </div>

      <!-- 树洞小纸条 -->
      <div v-if="activeTab === 'note'" class="note-panel">
        <div class="panel-title">💬 树洞小纸条</div>
        <div class="note-card" v-if="currentNote">
          <div class="note-avatar">{{ noteEmoji }}</div>
          <div class="note-content">"{{ currentNote.content }}"</div>
          <div class="note-meta">—— {{ currentNote.anonymousName }}</div>
        </div>
        <div class="note-actions">
          <van-button type="primary" round block @click="fetchRandomNote">
            <van-icon name="replay" /> 换一张纸条
          </van-button>
        </div>
        <p class="note-tip">纸条来自树洞，匿名分享，每张都是真实心事</p>
      </div>

      <!-- 决策转盘 -->
      <div v-if="activeTab === 'wheel'" class="wheel-panel">
        <div class="panel-title">🎰 决策转盘</div>
        <div class="wheel-game">
          <p class="game-desc">选择困难？让转盘帮你做决定！</p>
          <div class="wheel-result" v-if="wheelResult">
            <span class="result-label">🎲 结果</span>
            <span class="result-value">{{ wheelResult }}</span>
          </div>
          <div class="wheel-options">
            <div class="options-label">快捷选项：</div>
            <div class="options-buttons">
              <van-button size="small" plain round @click="setQuickOptions('food')">🍜 吃什么</van-button>
              <van-button size="small" plain round @click="setQuickOptions('drink')">🥤 喝什么</van-button>
              <van-button size="small" plain round @click="setQuickOptions('study')">📚 学哪科</van-button>
              <van-button size="small" plain round @click="setQuickOptions('sport')">⚽ 运动</van-button>
            </div>
          </div>
          <van-field
            v-model="wheelOptionsText"
            type="textarea"
            placeholder="自定义选项，用逗号分隔&#10;例如：奶茶,咖啡,果汁"
            rows="3"
            autosize
          />
          <van-button type="primary" round block @click="spinWheel" style="margin-top: 16px;">
            开始旋转
          </van-button>
          <div class="wheel-history" v-if="wheelHistory.length > 0">
            <span class="history-label">历史：</span>
            <span v-for="(item, idx) in wheelHistory.slice(0, 5)" :key="idx" class="history-tag">
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="center-footer">
      <span>—— 赣饶·广丰校圈 · 秘密基地 ——</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { supabase } from '../config/supabase.js'

const activeTab = ref('turtle')

// ========== 海龟汤 ==========
const turtleList = [
  { question: '男人走进餐厅，点了一份海龟汤，喝了一口后，回家自杀了。为什么？', hint: '他曾遭遇海难，同伴给他喝过"海龟汤"', answer: '他在海难中幸存，同伴给他喝"海龟汤"救了命。现在喝到真正的海龟汤，发现味道完全不同，意识到当年喝的是同伴的肉汤。' },
  { question: '女人在葬礼上看到一个陌生男子，一见钟情。一周后，她杀了自己的姐姐。为什么？', hint: '她以为男子会再次出现在葬礼上', answer: '她以为男子是姐姐的朋友，只有再办葬礼才能见到他。' },
  { question: '男子半夜醒来，发现妻子不在床上。他走到客厅，看到妻子坐在沙发上盯着窗外。他问怎么了，妻子说"睡不着"。第二天，男子报了警。', hint: '窗外有什么？', answer: '妻子是盲人，她说"睡不着"说明她恢复了视力，也意味着她看到了凶手的长相。' },
  { question: '一名男子入住酒店，第二天被发现死在房间里，房间从里面反锁。现场只有一滩水和碎玻璃。', hint: '男子是用什么自杀的？', answer: '男子用冰做成刀自杀，冰融化后只剩水和玻璃杯碎片。' },
  { question: '女人买了一双新鞋，第二天被发现死在公寓里，脚上穿着那双鞋。', hint: '鞋子有什么特别？', answer: '鞋子太小，女人穿不上。凶手把鞋子硬套在她脚上，制造她穿新鞋的假象。' }
]
const currentTurtleIndex = ref(0)
const currentTurtle = computed(() => turtleList[currentTurtleIndex.value])
const showTurtleHint = ref(false)
const showTurtleAnswer = ref(false)
const nextTurtle = () => {
  currentTurtleIndex.value = (currentTurtleIndex.value + 1) % turtleList.length
  showTurtleHint.value = false
  showTurtleAnswer.value = false
}

// ========== 性格实验室 ==========
const quizQuestions = [
  { question: '等电梯时，电梯刚好升上去，你只差一步。你会？', options: ['拼命按按钮', '等下一趟', '走楼梯', '大喊"等一下"'] },
  { question: '在一家快餐店，你点了汉堡加薯条，你会怎么吃？', options: ['把汉堡压扁了吃', '把肉拿出来单独吃', '一口汉堡一口薯条', '把薯条夹进汉堡里'] },
  { question: '你在森林里迷路了，眼前出现一只兔子，你觉得它会带你到？', options: ['一片花海', '一间小木屋', '一条小溪', '一个山洞'] }
]
const currentQuizIndex = ref(0)
const quizAnswers = ref([])
const personalityResult = ref(null)

const selectQuizOption = (idx) => {
  quizAnswers.value.push(idx)
  if (currentQuizIndex.value < quizQuestions.length - 1) {
    currentQuizIndex.value++
  } else {
    const results = [
      { emoji: '🦁', type: '勇敢的狮子', desc: '你天生具有领导气质，勇敢果断。', tags: ['#勇敢', '#领袖', '#热情'] },
      { emoji: '🦊', type: '聪明的狐狸', desc: '你机智灵活，善于观察。', tags: ['#机智', '#灵活', '#洞察力'] },
      { emoji: '🐼', type: '温和的熊猫', desc: '你性格温和，待人友善。', tags: ['#温柔', '#治愈', '#好人缘'] }
    ]
    personalityResult.value = results[Math.floor(Math.random() * results.length)]
  }
}
const resetQuiz = () => {
  currentQuizIndex.value = 0
  quizAnswers.value = []
  personalityResult.value = null
}

// ========== 猜数字 ==========
const secretNumber = ref(Math.floor(Math.random() * 100) + 1)
const guessNumber = ref('')
const guessResult = ref('')
const guessCount = ref(0)
const guessHistory = ref([])
const gameOver = ref(false)
const gameWon = ref(false)

const makeGuess = () => {
  const guess = parseInt(guessNumber.value)
  if (isNaN(guess) || guess < 1 || guess > 100) {
    showToast('请输入 1-100 的数字')
    return
  }
  guessCount.value++
  if (guess === secretNumber.value) {
    guessResult.value = '🎉 恭喜你猜对了！'
    gameWon.value = true
    guessHistory.value.push({ number: guess, result: 'correct' })
  } else if (guess < secretNumber.value) {
    guessResult.value = '📈 猜小了，再大一点'
    guessHistory.value.push({ number: guess, result: 'low' })
  } else {
    guessResult.value = '📉 猜大了，再小一点'
    guessHistory.value.push({ number: guess, result: 'high' })
  }
  guessNumber.value = ''
  if (guessCount.value >= 10 && !gameWon.value) {
    gameOver.value = true
    guessResult.value = `😢 机会用完了！数字是 ${secretNumber.value}`
  }
}
const resetGuess = () => {
  secretNumber.value = Math.floor(Math.random() * 100) + 1
  guessNumber.value = ''
  guessResult.value = ''
  guessCount.value = 0
  guessHistory.value = []
  gameOver.value = false
  gameWon.value = false
}

// ========== 运势签 ==========
const fortuneList = [
  { icon: '☀️', level: '大吉', desc: '诸事顺遂，贵人相助', number: 7, color: '金色', advice: '今天适合主动出击' },
  { icon: '🌤️', level: '中吉', desc: '平稳发展，小有收获', number: 3, color: '绿色', advice: '保持平常心' },
  { icon: '🌈', level: '惊喜', desc: '会有意想不到的好事发生', number: 9, color: '彩色', advice: '保持好奇心' }
]
const currentFortune = ref(null)
const fortuneDrawnToday = ref(false)
const todayDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const drawFortune = () => {
  if (fortuneDrawnToday.value) return
  currentFortune.value = fortuneList[Math.floor(Math.random() * fortuneList.length)]
  fortuneDrawnToday.value = true
  localStorage.setItem('fortune_drawn_date', todayDate.value)
}
const initFortune = () => {
  const savedDate = localStorage.getItem('fortune_drawn_date')
  if (savedDate === todayDate.value) {
    fortuneDrawnToday.value = true
  }
}

// ========== 照片墙 ==========
const uploadedPhotos = ref([])
const photoList = ref([])
const loadPhotos = () => {
  const saved = localStorage.getItem('secret_photos')
  if (saved) {
    try { photoList.value = JSON.parse(saved) } catch { photoList.value = [] }
  }
}
const afterReadPhoto = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    photoList.value.push({ url: e.target.result })
    localStorage.setItem('secret_photos', JSON.stringify(photoList.value))
  }
  reader.readAsDataURL(file.file)
  showToast('上传成功')
}
const removePhoto = (index) => {
  photoList.value.splice(index, 1)
  localStorage.setItem('secret_photos', JSON.stringify(photoList.value))
}

// ========== 小纸条 ==========
const currentNote = ref(null)
const noteEmoji = ref('🐼')
const fetchRandomNote = async () => {
  const { data } = await supabase.from('posts').select('content, anonymous_name').eq('is_deleted', false).limit(100)
  if (data && data.length) {
    const item = data[Math.floor(Math.random() * data.length)]
    currentNote.value = { content: item.content, anonymousName: item.anonymous_name }
  } else {
    currentNote.value = { content: '今天的夕阳很美，可惜没人一起看。', anonymousName: '匿名橘子' }
  }
  noteEmoji.value = ['🐼', '🐧', '🦊', '🐨'][Math.floor(Math.random() * 4)]
}

// ========== 转盘 ==========
const wheelOptionsText = ref('')
const wheelResult = ref('')
const wheelHistory = ref([])
const quickOptions = {
  food: '食堂,外卖,泡面,面包,水果',
  drink: '奶茶,咖啡,可乐,矿泉水,果汁',
  study: '数学,语文,英语,物理,化学',
  sport: '篮球,足球,跑步,羽毛球,乒乓球'
}
const setQuickOptions = (type) => {
  wheelOptionsText.value = quickOptions[type]
}
const spinWheel = () => {
  const options = wheelOptionsText.value.split(',').map(s => s.trim()).filter(s => s)
  if (options.length === 0) {
    showToast('请至少输入一个选项')
    return
  }
  const result = options[Math.floor(Math.random() * options.length)]
  wheelResult.value = result
  wheelHistory.value.unshift(result)
  if (wheelHistory.value.length > 10) wheelHistory.value.pop()
}

loadPhotos()
initFortune()
fetchRandomNote()
</script>

<style scoped>
.secret-center {
  min-height: 100vh;
  background: linear-gradient(145deg, #F4F9FF 0%, #E8F4FD 100%);
  padding-bottom: 40px;
}
.center-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-title { font-size: 20px; font-weight: 700; color: #2C3E50; }
.welcome-card {
  background: white;
  margin: 16px;
  padding: 20px;
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.06);
}
.welcome-icon { font-size: 48px; margin-bottom: 8px; }
.welcome-text { font-size: 18px; font-weight: 600; color: #2C3E50; margin-bottom: 4px; }
.welcome-sub { font-size: 14px; color: #7E9BB5; }
.feature-grid { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
.feature-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.04);
  cursor: pointer;
  border: 1px solid rgba(74, 144, 226, 0.06);
}
.feature-icon { font-size: 36px; width: 56px; height: 56px; background: #F0F7FF; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
.feature-info { flex: 1; }
.feature-info h3 { font-size: 16px; font-weight: 600; color: #2C3E50; margin-bottom: 2px; }
.feature-info p { font-size: 13px; color: #7E9BB5; }
.content-panel { margin: 16px; background: white; border-radius: 28px; padding: 20px; }
.panel-title { font-size: 18px; font-weight: 600; color: #2C3E50; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.progress { font-size: 14px; color: #7E9BB5; }
.turtle-question { font-size: 16px; line-height: 1.6; margin-bottom: 16px; }
.turtle-hint, .turtle-answer { background: #F8F9FA; border-radius: 16px; padding: 12px; margin-bottom: 12px; }
.turtle-actions { display: flex; gap: 8px; }
.turtle-tip { display: flex; align-items: center; gap: 6px; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #E0E8ED; color: #A0BBD0; font-size: 12px; }
.quiz-progress { margin-bottom: 16px; color: #7E9BB5; }
.quiz-question { font-size: 18px; font-weight: 500; margin-bottom: 24px; }
.quiz-options { display: flex; flex-direction: column; gap: 12px; }
.quiz-option {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: #F8F9FA; border-radius: 16px; cursor: pointer;
}
.option-letter {
  width: 28px; height: 28px; background: #E8F2FF; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; color: #4A90E2;
}
.quiz-result { text-align: center; padding: 20px 0; }
.result-avatar { font-size: 64px; margin-bottom: 16px; }
.result-type { font-size: 24px; font-weight: 700; color: #4A90E2; margin-bottom: 12px; }
.result-desc { color: #5a6c7e; margin-bottom: 16px; }
.result-tags { display: flex; justify-content: center; gap: 8px; }
.tag { background: #E8F2FF; color: #4A90E2; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
.guess-game { text-align: center; }
.guess-range { font-size: 48px; font-weight: 700; color: #4A90E2; }
.guess-history { display: flex; justify-content: center; gap: 8px; margin: 16px 0; }
.history-item {
  width: 36px; height: 36px; border-radius: 18px; display: flex;
  align-items: center; justify-content: center; font-weight: 600; color: white;
}
.history-item.low { background: #E74C3C; }
.history-item.high { background: #4A90E2; }
.history-item.correct { background: #27AE60; }
.fortune-card { text-align: center; padding: 20px 0; }
.fortune-icon { font-size: 64px; }
.fortune-level { font-size: 28px; font-weight: 700; color: #4A90E2; }
.fortune-detail { display: flex; justify-content: center; gap: 32px; margin: 20px 0; }
.fortune-advice { background: #F8F9FA; border-radius: 20px; padding: 12px; }
.photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.photo-item { position: relative; }
.photo-item img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 16px; }
.photo-remove {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  background: rgba(0,0,0,0.5); color: white; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.empty-photos { grid-column: span 2; text-align: center; padding: 40px 0; color: #A0BBD0; }
.note-card { text-align: center; padding: 30px 20px; }
.note-avatar { font-size: 48px; margin-bottom: 16px; }
.note-content { font-size: 18px; line-height: 1.6; color: #2C3E50; margin-bottom: 12px; }
.note-meta { color: #7E9BB5; }
.wheel-result {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 16px; background: #F0F7FF; border-radius: 20px; margin-bottom: 20px;
}
.result-value { font-size: 28px; font-weight: 700; color: #4A90E2; }
.wheel-history { margin-top: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.history-tag { background: #E8F2FF; color: #4A90E2; padding: 2px 10px; border-radius: 16px; font-size: 12px; }
.center-footer { text-align: center; color: #A0BBD0; font-size: 12px; margin-top: 20px; }
</style>